// Uji perilaku public/sw.js tanpa browser: dijalankan di sandbox `vm` dengan `self`, `caches`, dan `fetch` palsu.
// Jalankan:
//   node --experimental-transform-types --no-warnings tests/sw.test.mts <path-repo>
/* eslint-disable @typescript-eslint/no-explicit-any -- sandbox vm dengan objek palsu */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repo = path.resolve(process.argv[2] ?? ".");
const code = fs.readFileSync(path.join(repo, "public/sw.js"), "utf8");

type Handler = (e: any) => void;
function makeEnv(opts: { online: boolean; offlineHtml?: string }) {
  const handlers: Record<string, Handler> = {};
  const stores = new Map<string, Map<string, string>>();
  const fetched: string[] = [];
  const cacheApi = {
    open: async (name: string) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const s = stores.get(name)!;
      return {
        add: async (u: string) => {
          if (!opts.online) throw new Error("offline");
          s.set(new URL(u, "http://x").pathname, "cached");
        },
        put: async (req: any) => void s.set(new URL(req.url).pathname, "cached"),
        keys: async () => [...s.keys()],
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (n: string) => stores.delete(n),
    match: async (u: any) => {
      const p = new URL(typeof u === "string" ? u : u.url, "http://x").pathname;
      for (const s of stores.values()) if (s.has(p)) return { fromCache: p };
      return undefined;
    },
  };
  const self: any = {
    addEventListener: (t: string, h: Handler) => (handlers[t] = h),
    location: { origin: "https://app.test" },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  const ctx = vm.createContext({
    self,
    caches: cacheApi,
    URL,
    Response: class { ok = true; constructor(public body?: any) {} clone() { return this; } static error() { return { error: true }; } },
    fetch: async (r: any) => {
      const u = typeof r === "string" ? r : r.url;
      fetched.push(new URL(u, "https://app.test").pathname);
      if (!opts.online) throw new Error("offline");
      if (String(u).endsWith("/offline")) return { ok: true, text: async () => opts.offlineHtml ?? "", clone() { return this; } };
      return { ok: true, clone() { return this; }, from: "network" };
    },
    Promise, Array, Set,
  });
  vm.runInContext(code, ctx);
  const fire = async (type: string, extra: any = {}) => {
    let p: Promise<any> | undefined;
    handlers[type]({ ...extra, waitUntil: (x: Promise<any>) => (p = x), respondWith: (x: any) => (p = Promise.resolve(x)) });
    return p;
  };
  return { fire, stores, fetched, handlers };
}

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`ok - ${name}`);
}
const req = (url: string, mode = "cors", method = "GET") => ({ url: `https://app.test${url}`, mode, method });

await test("install: pra-cache /offline, ikon, manifest, dan aset /_next/static yang dipakai /offline", async () => {
  const env = makeEnv({ online: true, offlineHtml: '<link href="/_next/static/css/a.css"><script src="/_next/static/chunks/b.js"></script>' });
  await env.fire("install");
  const cached = [...(env.stores.get("lll-v1") ?? new Map()).keys()];
  for (const p of ["/offline", "/icon.png", "/icon.svg", "/manifest.webmanifest", "/_next/static/css/a.css", "/_next/static/chunks/b.js"]) {
    assert.ok(cached.includes(p), `${p} harus di-cache`);
  }
});

await test("install tidak gagal saat offline", async () => {
  const env = makeEnv({ online: false });
  await env.fire("install");
});

await test("activate: cache versi lama dihapus, lll-v1 dipertahankan", async () => {
  const env = makeEnv({ online: true });
  await (await import("node:util")).promisify(setTimeout)(0);
  await env.stores.set("lll-v0", new Map());
  await env.stores.set("lll-v1", new Map());
  await env.fire("activate");
  assert.deepEqual([...env.stores.keys()], ["lll-v1"]);
});

await test("navigasi online → jaringan (tidak dari cache)", async () => {
  const env = makeEnv({ online: true });
  const res = await env.fire("fetch", { request: req("/dashboard", "navigate") });
  assert.equal(res.from, "network");
  assert.ok(env.fetched.includes("/dashboard"));
});

await test("navigasi offline → /offline dari cache", async () => {
  const on = makeEnv({ online: true });
  await on.fire("install");
  const env = makeEnv({ online: false });
  env.stores.set("lll-v1", on.stores.get("lll-v1")!);
  const res = await env.fire("fetch", { request: req("/library", "navigate") });
  assert.equal(res.fromCache, "/offline");
});

await test("halaman yang butuh login TIDAK pernah disimpan ke cache", async () => {
  const env = makeEnv({ online: true });
  await env.fire("fetch", { request: req("/dashboard", "navigate") });
  await env.fire("fetch", { request: req("/read/123", "navigate") });
  const all = [...env.stores.values()].flatMap((s) => [...s.keys()]);
  assert.deepEqual(all, []);
});

await test("/api/*, /auth/*, POST, dan lintas-origin tidak dicegat", async () => {
  const env = makeEnv({ online: true });
  for (const r of [req("/api/tts"), req("/auth/signout"), req("/offline", "navigate", "POST"), { url: "https://x.supabase.co/rest/v1/a", mode: "cors", method: "GET" }]) {
    let responded = false;
    env.handlers.fetch({ request: r, respondWith: () => (responded = true) });
    assert.equal(responded, false, `${r.url} tidak boleh dicegat`);
  }
});

await test("aset /_next/static: cache-first, disimpan saat pertama diambil", async () => {
  const env = makeEnv({ online: true });
  await env.fire("fetch", { request: req("/_next/static/chunks/x.js", "no-cors") });
  await new Promise((r) => setTimeout(r, 0));
  const cached = [...(env.stores.get("lll-v1") ?? new Map()).keys()];
  assert.ok(cached.includes("/_next/static/chunks/x.js"));
  const before = env.fetched.length;
  const hit = await env.fire("fetch", { request: req("/_next/static/chunks/x.js", "no-cors") });
  assert.equal(hit.fromCache, "/_next/static/chunks/x.js");
  assert.equal(env.fetched.length, before, "tidak mengambil ulang dari jaringan");
});

console.log(`\n${passed} lulus, 0 gagal`);
