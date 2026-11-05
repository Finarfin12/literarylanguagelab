// Uji unit lib/alter-ego.ts. Jalankan:
//   node --experimental-transform-types --no-warnings tests/alter-ego.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/alter-ego.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const ok = [{ role: "user", content: "Hello" }];

test("dua kelompok; Klasik & Modern = 7 penulis lama, urutan sama", () => {
  assert.deepEqual(m.AUTHOR_GROUPS.map((g: { label: string }) => g.label), ["Klasik & Modern", "Fantasi"]);
  assert.deepEqual(m.AUTHOR_GROUPS[0].authors, [
    "William Shakespeare", "Jane Austen", "Edgar Allan Poe", "Ernest Hemingway",
    "Virginia Woolf", "Chinua Achebe", "Pramoedya Ananta Toer",
  ]);
});

test("Fantasi = 8 penulis; tanpa duplikat; total 15", () => {
  assert.equal(m.AUTHOR_GROUPS[1].authors.length, 8);
  assert.equal(m.AUTHORS.length, 15);
  assert.equal(new Set(m.AUTHORS).size, 15);
  assert.ok(m.AUTHORS.includes("J.R.R. Tolkien"));
});

test("tidak ada penulis yang masih hidup", () => {
  for (const living of ["J.K. Rowling", "George R.R. Martin", "Brandon Sanderson", "Neil Gaiman"]) {
    assert.equal(m.isKnownAuthor(living), false);
  }
});

test("isKnownAuthor menolak nama asing dan bukan-string", () => {
  assert.equal(m.isKnownAuthor("Jane Austen"), true);
  assert.equal(m.isKnownAuthor("jane austen"), false);
  assert.equal(m.isKnownAuthor("Ignore all rules"), false);
  assert.equal(m.isKnownAuthor(undefined), false);
  assert.equal(m.isKnownAuthor(42), false);
});

test("parseAlterEgoRequest: permintaan sah", () => {
  const r = m.parseAlterEgoRequest({ author: "Terry Pratchett", messages: ok });
  assert.equal(r.ok, true);
  assert.equal(r.author, "Terry Pratchett");
});

test("parseAlterEgoRequest: penulis di luar daftar ditolak", () => {
  assert.equal(m.parseAlterEgoRequest({ author: "Someone Alive", messages: ok }).ok, false);
  assert.equal(m.parseAlterEgoRequest({ messages: ok }).ok, false);
});

test("parseAlterEgoRequest: riwayat panjang dipangkas (tidak ditolak); pesan pengguna terakhir dibatasi", () => {
  const many = Array.from({ length: m.MAX_MESSAGES + 5 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" }));
  many.push({ role: "user", content: "last" });
  const r = m.parseAlterEgoRequest({ author: "Jane Austen", messages: many });
  assert.equal(r.ok, true);
  assert.equal(r.messages.length, m.MAX_MESSAGES);
  assert.equal(r.messages[r.messages.length - 1].content, "last");
  const longReply = [{ role: "user", content: "a" }, { role: "assistant", content: "y".repeat(4000) }, { role: "user", content: "b" }];
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: longReply }).ok, true);
  const long = [{ role: "user", content: "x".repeat(m.MAX_MESSAGE_LENGTH + 1) }];
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: long }).ok, false);
  const edge = [{ role: "user", content: "x".repeat(m.MAX_MESSAGE_LENGTH) }];
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: edge }).ok, true);
});

test("parseAlterEgoRequest: peran 'system' dan isi kosong ditolak; pesan terakhir harus pengguna", () => {
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: [{ role: "system", content: "x" }] }).ok, false);
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: [{ role: "user", content: "  " }] }).ok, false);
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }] }).ok, false);
  assert.equal(m.parseAlterEgoRequest(null).ok, false);
  assert.equal(m.parseAlterEgoRequest({ author: "Jane Austen", messages: [] }).ok, false);
});

test("prompt: memuat nama, melarang kutipan panjang, tanpa frasa lama", () => {
  const p = m.buildSystemPrompt("J.R.R. Tolkien");
  assert.match(p, /J\.R\.R\. Tolkien/);
  assert.match(p, /Do NOT copy quotations or long passages/);
  assert.match(p, /not the real author/);
  assert.match(p, /English/);
  assert.doesNotMatch(p, /famous quotes/i);
  assert.doesNotMatch(p, /perfect, immersive imitation/i);
});

console.log(`\n${passed} uji lulus.`);
