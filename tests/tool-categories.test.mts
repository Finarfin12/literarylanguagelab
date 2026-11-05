// Uji Fase 23: kategori /tools, label dan susunan ruang, pintasan Beranda, dan filter Grammar. Jalankan:
//   node --experimental-transform-types --no-warnings tests/tool-categories.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const tc = await load("lib/tool-categories.ts");
const rooms = await load("lib/rooms.ts");
const tf = await load("lib/topic-filter.ts");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// Semua alat yang tampil di /tools: alat dinamis (tools-config) + alat statis di halaman
const dynamicIds = [...read("lib/tools-config.ts").matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((m) => m[1]);
const pageSrc = read("app/(dashboard)/tools/page.tsx");
const staticIds = [...pageSrc.matchAll(/id:\s*"([^"]+)",\s*title:/g)].map((m) => m[1]);
const allIds = [...new Set([...dynamicIds, ...staticIds])];

test("setiap alat di /tools punya kategori (alat baru wajib dikategorikan)", () => {
  assert.ok(dynamicIds.length >= 27 && staticIds.length >= 6, `alat terbaca: ${dynamicIds.length} dinamis, ${staticIds.length} statis`);
  const missing = allIds.filter((id) => !tc.hasCategory(id));
  assert.deepEqual(missing, []);
  // tidak ada kategori untuk alat yang tidak ada lagi
  const stale = tc.categorizedToolIds().filter((id: string) => !allIds.includes(id));
  assert.deepEqual(stale, []);
});

test("lima kategori, semuanya berisi alat, dan tidak ada yang terlalu menumpuk", () => {
  assert.deepEqual(tc.TOOL_CATEGORIES.map((c: { label: string }) => c.label), [
    "Pemahaman & Kosakata",
    "Kajian Sastra & Teori",
    "Penulisan",
    "Bantuan Penerjemahan",
    "Latihan Interaktif",
  ]);
  const tools = allIds.map((id) => ({ id, title: id, description: "" }));
  const groups = tc.groupToolsByCategory(tools);
  assert.equal(groups.length, 5);
  for (const g of groups) assert.ok(g.tools.length >= 2 && g.tools.length <= 14, `${g.label}: ${g.tools.length}`);
  assert.equal(groups.reduce((n: number, g: { tools: unknown[] }) => n + g.tools.length, 0), allIds.length, "tidak ada alat yang hilang atau ganda");
});

test("pencarian dan filter: semua alat tetap bisa ditemukan", () => {
  const tools = [
    { id: "idioms", title: "Idiom Library", description: "Direktori idiom" },
    { id: "alter-ego", title: "Alter Ego Chat", description: "Ngobrol dengan penulis" },
    { id: "essay-auditor", title: "Essay Auditor", description: "Audit esai" },
  ];
  assert.equal(tc.filterTools(tools, {}).length, 3);
  assert.equal(tc.filterTools(tools, { category: tc.ALL_CATEGORY }).length, 3);
  assert.deepEqual(tc.filterTools(tools, { category: "latihan" }).map((t: { id: string }) => t.id), ["alter-ego"]);
  assert.deepEqual(tc.filterTools(tools, { query: "ESAI" }).map((t: { id: string }) => t.id), ["essay-auditor"]);
  assert.deepEqual(tc.filterTools(tools, { query: "idiom", category: "pemahaman" }).map((t: { id: string }) => t.id), ["idioms"]);
  assert.equal(tc.filterTools(tools, { query: "zzz" }).length, 0);
  assert.equal(tc.categoryOf("alat-baru-belum-terdaftar"), "pemahaman");
  assert.equal(tc.categoryLabel("semua"), "Semua Alat");
  // Nama alat tidak diubah (judul alat dinamis tetap sama dengan sebelumnya)
  for (const title of ["Mood Transformer", "Essay Auditor", "Idiom & Metaphor Detector", "Imagery Grader", "Difficulty Predictor"]) {
    assert.ok(read("lib/tools-config.ts").includes(`title: "${title}"`), title);
  }
});

test("halaman /tools memakai kategori Indonesia dan tidak lagi memuat nama kategori lama", () => {
  for (const old of ["Targeted Transformers", "Analysis Extractors", "Lexicon & Databases"]) assert.ok(!pageSrc.includes(old), old);
  assert.match(pageSrc, /from "@\/lib\/tool-categories"/);
  assert.match(pageSrc, /Semua Alat/);
});

// --- Label dan susunan ruang ---
test("label ruang baru, slug lama tetap", () => {
  const byslug = (s: string) => rooms.getRoom(s);
  assert.equal(byslug("belajar-dasar").title, "Belajar Bahasa Inggris");
  assert.equal(byslug("baca-sastra").title, "Membaca & Sastra");
  assert.equal(byslug("terjemah").title, "Menerjemahkan");
  assert.deepEqual(rooms.ROOMS.map((r: { slug: string }) => r.slug), ["belajar-dasar", "baca-sastra", "terjemah", "koleksi", "komunitas"]);
  // label lama tidak tersisa di kode (selain dokumen)
  for (const f of ["lib/rooms.ts", "components/Sidebar.tsx", "components/MobileMenu.tsx", "app/(dashboard)/dashboard/page.tsx", "app/(dashboard)/help/page.tsx"]) {
    if (!fs.existsSync(path.join(repo, f))) continue;
    const src = read(f);
    for (const old of ["Belajar Dasar", "Baca & Kajian Sastra", "Ruang Terjemah"]) assert.ok(!src.includes(old), `${f}: ${old}`);
  }
});

const titles = (slug: string) => rooms.getRoom(slug).sections.map((s: { title: string }) => s.title);
const pathsOf = (slug: string) => rooms.getRoom(slug).sections.flatMap((s: { paths: string[] }) => s.paths);

test("Membaca & Sastra: urutan kerja dari sumber bacaan sampai eksperimen kreatif", () => {
  assert.deepEqual(titles("baca-sastra").slice(0, 5), ["Sumber bacaan", "Memahami konteks", "Bedah sastra & teori", "Penulisan & portofolio", "Eksperimen kreatif"]);
  const writing = rooms.getRoom("baca-sastra").sections.find((s: { title: string }) => s.title === "Penulisan & portofolio").paths;
  for (const p of ["/tools/academic-outline", "/tools/writing-assistant", "/tools/essay-auditor", "/tools/paraphrase", "/tools/case-study-generator"]) assert.ok(writing.includes(p), p);
  assert.ok(pathsOf("baca-sastra").includes("/lingowise"));
});

test("Menerjemahkan dibuka dengan Pra-terjemah dan evaluasi memuat Imagery Grader", () => {
  assert.equal(titles("terjemah")[0], "Pra-terjemah");
  const pre = rooms.getRoom("terjemah").sections[0].paths;
  assert.deepEqual(pre, ["/tools/idiom-detector", "/tools/cultural-context", "/tools/dialect-diver", "/tools/untranslatables"]);
  const evalSection = rooms.getRoom("terjemah").sections.find((s: { title: string }) => s.title === "Evaluasi & perbandingan");
  assert.ok(evalSection.paths.includes("/tools/imagery-grader"));
  assert.ok(pathsOf("terjemah").includes("/translation-workshop"));
});

test("Belajar Bahasa Inggris: paraphrase pindah ke Membaca & Sastra; Kursus tetap ke-3 dan tidak ada fitur yang hilang", () => {
  assert.ok(!pathsOf("belajar-dasar").includes("/tools/paraphrase"));
  assert.ok(pathsOf("baca-sastra").includes("/tools/paraphrase"));
  assert.equal(pathsOf("belajar-dasar")[2], "/kursus");
  assert.ok(pathsOf("belajar-dasar").includes("/frasa-harian"));
  // Setiap path ruang tetap ada di minimal satu ruang (uji cakupan penuh ada di menu-coverage)
  const covered = rooms.allRoomPaths();
  for (const p of ["/tools/paraphrase", "/tools/untranslatables", "/tools/imagery-grader", "/tools/essay-auditor", "/tools/case-study-generator", "/tools/academic-outline"]) assert.ok(covered.has(p), p);
});

test("pintasan Beranda: Mulai dari Nol, Lanjutkan Membaca, Mulai Menerjemahkan", () => {
  const withData = rooms.homeShortcuts({ courseHref: "/kursus/salam-perkenalan", readingHref: "/read/abc" });
  assert.deepEqual(withData.map((s: { label: string }) => s.label), ["Mulai dari Nol", "Lanjutkan Membaca", "Mulai Menerjemahkan"]);
  assert.deepEqual(withData.map((s: { href: string }) => s.href), ["/kursus/salam-perkenalan", "/read/abc", "/ruang/terjemah"]);
  const empty = rooms.homeShortcuts({});
  assert.deepEqual(empty.map((s: { href: string }) => s.href), ["/ruang/belajar-dasar", "/ruang/baca-sastra", "/ruang/terjemah"]);
  assert.equal(rooms.homeShortcuts({ courseHref: null, readingHref: "" })[1].href, "/ruang/baca-sastra");
  for (const s of empty) assert.ok(rooms.getRoom(s.href.replace("/ruang/", "")), s.href);
});

// --- Grammar ---
test("filter dan progres topik Grammar", () => {
  const topics = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }];
  const done = new Set(["a", "c"]);
  assert.deepEqual(tf.filterTopics(topics, done, "semua").map((t: { slug: string }) => t.slug), ["a", "b", "c", "d"]);
  assert.deepEqual(tf.filterTopics(topics, done, "belum").map((t: { slug: string }) => t.slug), ["b", "d"]);
  assert.deepEqual(tf.filterTopics(topics, done, "selesai").map((t: { slug: string }) => t.slug), ["a", "c"]);
  assert.deepEqual(tf.topicProgress(topics, done), { done: 2, total: 4, percent: 50, text: "2 dari 4 topik selesai" });
  assert.deepEqual(tf.topicProgress([], new Set()), { done: 0, total: 0, percent: 0, text: "0 dari 0 topik selesai" });
  assert.equal(tf.topicProgress(topics, new Set(["zzz"])).done, 0, "slug asing tidak dihitung");
  assert.equal(tf.levelProgressText(3, 10), "3 dari 10 topik selesai");
  assert.deepEqual(tf.TOPIC_FILTERS.map((f: { label: string }) => f.label), ["Semua", "Belum", "Selesai"]);
  const list = read("app/(dashboard)/english-lab/grammar/TopicList.tsx");
  assert.ok(!/\{doneCount\}\/\{inLevel\.length\}/.test(list), "teks '3/10' diganti kalimat lengkap");
  assert.match(list, /aria-pressed/);
  // spasi antara judul level dan badge supaya pembaca layar tidak membaca "Level A10 dari 2"
  assert.ok(list.includes('Level {level}{" "}'));
});

console.log(`\n${passed} lulus, 0 gagal`);
