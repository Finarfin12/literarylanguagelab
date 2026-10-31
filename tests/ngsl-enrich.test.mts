// Uji unit scripts/lib/ngsl-enrich.mjs. Jalankan:
//   node --experimental-transform-types --no-warnings tests/ngsl-enrich.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "scripts/lib/ngsl-enrich.mjs")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

// ---------- parseDefinitions ----------
test("parseDefinitions: header 'Definitons' (ejaan file asli) dan BOM dikenali", () => {
  const csv = '﻿Word,Definitons\r\nabuse,"to treat someone in a cruel, harmful way"\r\naccident,sudden unplanned event\r\n';
  const d = m.parseDefinitions(csv);
  assert.equal(d.get("abuse"), "to treat someone in a cruel, harmful way");
  assert.equal(d.get("accident"), "sudden unplanned event");
  assert.equal(d.size, 2);
});

test("parseDefinitions: TRUE/FALSE dari Excel menjadi huruf kecil", () => {
  const d = m.parseDefinitions("Word,Definitons\nTRUE,agreeing with the facts\nFALSE,not real\n");
  assert.equal(d.get("true"), "agreeing with the facts");
  assert.equal(d.get("false"), "not real");
  assert.equal(d.has("TRUE"), false);
});

test("parseDefinitions: spasi dirapikan, kata ganda digabung, baris kosong dilewati", () => {
  const d = m.parseDefinitions('word,definition\n  Left  ,  the   opposite of right \nleft,"went away; departed"\nleft,the opposite of right\nempty,\n,tanpa kata\n');
  assert.equal(d.get("left"), "the opposite of right; went away; departed");
  assert.equal(d.has("empty"), false);
  assert.equal(d.size, 1);
});

test("parseDefinitions: header tanpa kolom kata/definisi → error jelas", () => {
  assert.throws(() => m.parseDefinitions("a,b\n1,2\n"), /Kolom kata\/definisi/);
  assert.equal(m.parseDefinitions("").size, 0);
});

// ---------- parseForms ----------
test("parseForms: search → searches, searched, searching", () => {
  const f = m.parseForms("search,searches,searched,searching\n");
  assert.deepEqual(f.get("search"), ["searches", "searched", "searching"]);
});

test("parseForms: komentar ## dan baris kosong diabaikan; CRLF dan BOM aman", () => {
  const text = "﻿## komentar\r\n## lagi\r\n\r\nabandon,abandons,abandoned,abandoning\r\nabout\r\n";
  const f = m.parseForms(text);
  assert.deepEqual([...f.keys()], ["abandon", "about"]);
  assert.deepEqual(f.get("about"), []);
});

test("parseForms: potongan kontraksi tidak ikut (be, have, do, will)", () => {
  const f = m.parseForms(
    "be,am,m,is,isn,s,are,re,aren,ain,been,was,wasn,were,weren,being,bein,beings\n" +
      "have,haven,ve,has,hasn,had,hadn,d,having,hafta\n" +
      "do,does,don,doesn,did,didn,doing,done,doin\n" +
      "will,wills,willed,willing,won,ll\n"
  );
  assert.deepEqual(f.get("be"), ["am", "is", "are", "been", "was", "were", "being", "beings"]);
  assert.deepEqual(f.get("have"), ["has", "had", "having", "hafta"]);
  assert.deepEqual(f.get("do"), ["does", "did", "doing", "done", "doin"]);
  assert.deepEqual(f.get("will"), ["wills", "willed", "willing"]);
  for (const bad of ["m", "s", "isn", "ve", "d", "ll", "won"]) {
    for (const list of f.values()) assert.equal(list.includes(bad), false, `${bad} seharusnya dibuang`);
  }
});

test("parseForms: homograf digabung tanpa duplikat; headword sendiri dibuang", () => {
  const f = m.parseForms("found,founds,founded,found,founding\nfound,finds\nrose,roses\n");
  assert.deepEqual(f.get("found"), ["founds", "founded", "founding", "finds"]);
  assert.deepEqual(f.get("rose"), ["roses"]);
});

test("parseForms: hanya huruf dan tanda hubung; huruf besar jadi kecil", () => {
  const f = m.parseForms("website,websites,web-site,web-sites,web site,web sites\nEmail,Emails,e-mail,4x\n");
  assert.deepEqual(f.get("website"), ["websites", "web-site", "web-sites"]);
  assert.deepEqual(f.get("email"), ["emails", "e-mail"]);
});

// ---------- buildEnrichment ----------
test("buildEnrichment: hanya kata yang sudah ada di core_words", () => {
  const defs = m.parseDefinitions("Word,Definitons\nsearch,to look for something\nghost,not in core\nTRUE,real\n");
  const forms = m.parseForms("search,searches,searched,searching\nghost,ghosts\n");
  const r = m.buildEnrichment(["search", "true", "plain"], { definitions: defs, forms });

  assert.deepEqual(r.updates.map((u: { word: string }) => u.word), ["search", "true"]);
  const search = r.updates.find((u: { word: string }) => u.word === "search");
  assert.equal(search.definition_en, "to look for something");
  assert.deepEqual(search.forms, ["searches", "searched", "searching"]);
  assert.deepEqual(r.definitionsNotInCore, ["ghost"]);
  assert.deepEqual(r.formsNotInCore, ["ghost"]);
  assert.deepEqual(r.coreWithoutDefinition, ["plain"]);
  assert.equal(r.withDefinition, 2);
  assert.equal(r.withForms, 1);
});

test("buildEnrichment: salah satu sumber boleh kosong; tidak pernah menyentuh kolom lain", () => {
  const onlyDefs = m.buildEnrichment(["a"], { definitions: new Map([["a", "x"]]) });
  assert.deepEqual(onlyDefs.updates, [{ word: "a", definition_en: "x" }]);
  const onlyForms = m.buildEnrichment(["a"], { forms: new Map([["a", ["as"]]]) });
  assert.deepEqual(onlyForms.updates, [{ word: "a", forms: ["as"] }]);
  const none = m.buildEnrichment(["a"], {});
  assert.deepEqual(none.updates, []);
  for (const u of [...onlyDefs.updates, ...onlyForms.updates]) {
    for (const key of Object.keys(u)) assert.ok(["word", "definition_en", "forms"].includes(key), `kolom terlarang: ${key}`);
  }
});

test("buildEnrichment: kata core_words dinormalkan ke huruf kecil", () => {
  const r = m.buildEnrichment(["Search"], { definitions: new Map([["search", "look for"]]) });
  assert.equal(r.updates[0].word, "search");
});

test("buildEnrichment: ejaan bertanda hubung (email ↔ e-mail) tetap cocok, tanpa menimpa kecocokan persis", () => {
  const defs = new Map([["e-mail", "a message sent by computer"]]);
  const forms = new Map([["e-mail", ["e-mails"]]]);
  const r = m.buildEnrichment(["email"], { definitions: defs, forms });
  assert.deepEqual(r.updates, [{ word: "email", definition_en: "a message sent by computer", forms: ["e-mails"] }]);
  assert.deepEqual(r.definitionsNotInCore, []);
  assert.deepEqual(r.formsNotInCore, []);
  assert.deepEqual(r.coreWithoutDefinition, []);
  // jika "e-mail" sendiri ada di core_words, hanya kecocokan persis yang dipakai
  const both = m.buildEnrichment(["email", "e-mail"], { definitions: defs });
  assert.deepEqual(both.updates, [{ word: "e-mail", definition_en: "a message sent by computer" }]);
  assert.deepEqual(both.coreWithoutDefinition, ["email"]);
});

console.log(`\n${passed} lulus, 0 gagal`);
