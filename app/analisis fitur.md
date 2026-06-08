# Analisis Lexicon Studio → Implementasi Literary Language Lab

**Dibuat:** 2026-06-08  
**Sumber kode:** `C:\Website vercel backup\the lexicon\kode.gs`  
**Relasi:** [[PRD]] | [[Referensi_The_Lexicon_Studio]]

> Dokumen ini menganalisis prompt dan logika backend Lexicon Studio secara teknis,
> lalu menentukan bagaimana setiap fitur diadaptasi ke LLL (Next.js + Supabase + Groq).

---

## Model & Konfigurasi Groq (dari kode asli)

```
Model teks  : llama-3.3-70b-versatile
Model vision: llama-3.2-11b-vision-preview
Temperature : 0.7
Endpoint    : https://api.groq.com/openai/v1/chat/completions
System msg  : "You are a helpful and highly intelligent literature assistant. Use Markdown formatting."
```

**Catatan untuk LLL:**
- Groq key harus di server-side (Next.js API Routes), tidak pernah di client
- Model sama bisa dipakai, tapi buat abstraksi provider agar mudah ganti model
- Temperature 0.7 bagus untuk kreatif — pertahankan untuk fitur generatif, turunkan ke 0.3 untuk analisis/grammar

---

## Analisis Per Fitur & Rencana Implementasi

### 1. Tone & Grammar Analyzer
**Prompt asli:** Analisis teks, before/after, penjelasan grammar, tone of voice + CEFR level.  
**Yang bagus:** Menyebut CEFR level — ini sangat relevan untuk learner.  
**Adaptasi LLL:** Tambahkan satu layer: setelah analisis, simpan kata/frasa yang diperbaiki otomatis ke Vocabulary Bank user. Buat endpoint `/api/analyze-tone`.

### 2. Vibe Translator
**Prompt asli:** 3 poin — Emotional Tone, Key Word, Simple Paraphrase.  
**Yang bagus:** Struktur output yang ringkas dan tidak overwhelming.  
**Adaptasi LLL:** Cocok sebagai fitur "Quick Read" — klik teks, dapat 3 poin cepat. Integrasi ke Close Reading Mode.

### 3. Mood Transformer
**Prompt asli:** Ubah kalimat ke mood tertentu (2 variasi + alasan diksi).  
**Adaptasi LLL:** Jadikan fitur latihan menulis — user menulis kalimat, lalu bisa lihat versi dengan mood berbeda. Berguna untuk belajar nuansa diksi.

### 4. Diction Lab
**Prompt asli:** 3 level literary untuk kalimat sederhana — Basic, Poetic, Shakespearean.  
**Yang bagus:** Progressif — menunjukkan eskalasi gaya dengan jelas.  
**Adaptasi LLL:** Ini adalah fitur belajar yang sangat kuat. Bisa dijadikan "Writing Ladder" — user input kalimat sederhana, LLL tunjukkan bagaimana kalimat yang sama ditulis di 3 level. Simpan contoh ke learning history.

### 5. Era Translator
**Prompt asli:** Terjemahkan ke Victorian, Modernist, Renaissance + analisis struktur.  
**Adaptasi LLL:** Tambahkan era yang lebih relevan untuk mahasiswa sastra Indonesia: Romanticism, Post-Colonial. Cocok untuk persiapan baca teks klasik di semester mendatang.

### 6. Sentence Architect
**Prompt asli:** Bedah kalimat dengan color-coding HTML (Subject=biru, Verb=merah, Adjective=kuning).  
**Yang bagus:** Visual parsing — sangat membantu untuk grammar visual learner.  
**Adaptasi LLL:** Pertahankan color-coding, tapi render lebih clean di Next.js. Tambahkan toggle "show/hide labels" agar tidak overwhelming.

### 7. Dialect Diver
**Prompt asli:** Terjemahkan ke Standard English + asal dialek + dampak sosial/kelas karakter.  
**Yang bagus:** Analisis dampak sosial — ini level sastra yang sebenarnya, bukan sekadar terjemahan.  
**Adaptasi LLL:** Sangat berguna untuk mahasiswa yang baca novel klasik dengan karakter working-class (Dickens, Hardy). Pertahankan persis.

### 8. Rhetorical Devices Spotter
**Prompt asli:** Identifikasi majas + efek psikologis/estetis/ritmis.  
**Yang bagus:** Tidak hanya nama majas, tapi efeknya — ini yang membuat analisis sastra bermakna.  
**Adaptasi LLL:** Jadikan fitur highlight interaktif — setiap majas bisa diklik untuk lihat penjelasan. Simpan temuan ke catatan reading session.

### 9. Imagery Sketcher
**Prompt asli:** Moodboard deskriptif — suasana, pencahayaan, warna, tekstur seperti lukisan/scene film.  
**Adaptasi LLL:** Bagus untuk latihan apresiasi puisi. Bisa dijadikan prompt untuk latihan menulis balik — "tulis puisi dari moodboard ini".

### 10. Sentiment Spectrum Analyzer
**Prompt asli:** Kategorikan "suhu" emosi setiap kalimat dengan warna (Crimson Red, Indigo Blue, dll).  
**Yang bagus:** Metafora warna untuk emosi — sangat intuitif dan memorable.  
**Adaptasi LLL:** Render sebagai visual timeline emosi, bukan hanya bullet list. Vis.js atau D3 bisa dipakai.

### 11. Literary Synonyms
**Prompt asli:** 10 "Literary Synonym" + kapan situasi dan emosi yang tepat memakainya.  
**Yang bagus:** Bukan sekadar sinonim — tapi konteks penggunaan. Ini yang membedakan dengan kamus biasa.  
**Adaptasi LLL:** Integrasi langsung ke Word Lookup. Ketika user klik kata di teks, salah satu tab hasilnya adalah Literary Synonyms ini.

### 12. Cultural Context Decoder
**Prompt asli:** Makna asli + asal-usul budaya/sejarah/mitologi + contoh penggunaan.  
**Yang bagus:** Menyentuh lapisan budaya yang tidak ada di kamus manapun.  
**Adaptasi LLL:** Fitur prioritas untuk mahasiswa penerjemahan. Terjemahan yang baik butuh pemahaman konteks budaya. Jadikan tab tersendiri di Word Lookup.

### 13. Nuance Detector
**Prompt asli:** Perbedaan "rasa" konotasi kata-kata yang mirip — mana lebih hangat, dingin, formal, kasual.  
**Yang bagus:** Langsung menjawab kebutuhan translator — memilih kata yang tepat dari sekumpulan sinonim.  
**Adaptasi LLL:** Sangat relevan untuk Translation Workshop. Sebelum user terjemahkan, bisa cek nuansa kata yang akan dipakai.

### 14. Metaphor Generator
**Prompt asli:** 3 metafora berbeda + makna/emosi + penjelasan.  
**Adaptasi LLL:** Fitur latihan menulis kreatif. Cocok untuk tugas menulis puisi/prosa pendek.

### 15. Literary Time Traveler
**Prompt asli:** Evolusi makna kata di Renaissance, Victorian, Modern + contoh konteks.  
**Yang bagus:** Menunjukkan bahwa bahasa hidup dan berubah — penting untuk baca teks dari berbagai era.  
**Adaptasi LLL:** Pertahankan. Tambahkan era Post-Colonial dan Contemporary.

### 16. Semantic Map
**Prompt asli:** JSON nodes + edges untuk vis.js network graph.  
**Catatan teknis:** Parsing JSON dari LLM rentan gagal — kode asli sudah handle dengan `indexOf('{')`.  
**Adaptasi LLL:** Pertahankan konsep, tapi gunakan library yang lebih ringan di React (react-force-graph atau visx). Tambahkan retry logic untuk parsing JSON.

### 17. Paraphrase Challenge
**Prompt asli:** Generate 1 kalimat sastra klasik (max 20 kata) → user parafrase → evaluasi AI (makna terjaga, nuansa, skor 1-10).  
**Yang bagus:** Loop belajar yang lengkap: tantangan → usaha → feedback.  
**Adaptasi LLL:** Ini adalah fitur killer untuk LLL. Tambahkan:
- Pilih level kesulitan (CEFR B1/B2/C1)
- Simpan history paraphrase + skor ke database
- Progress tracking dari waktu ke waktu

### 18. Alter Ego Chat
**Prompt asli:** Role-play sebagai penulis legendaris (Shakespeare, Hemingway, dll) + terjemahan Indonesia.  
**Adaptasi LLL:** Menarik untuk eksplorasi sastra. Bisa dijadikan fitur "Meet the Author" — konteks historis penulis + gaya tulisnya.

### 19. Imagery Grader
**Prompt asli:** Koreksi grammar + skor literary devices + contoh perbaikan.  
**Adaptasi LLL:** Bagus untuk self-assessment tulisan user sendiri. Integrasi ke Translation Workshop — setelah terjemah, bisa grade hasilnya.

### 20. Reading Companion
**Prompt asli:** Jawab pertanyaan analisis sastra secara mendalam, only in English.  
**Catatan:** System prompt-nya "only in English" — ini justru bagus untuk immersion.  
**Adaptasi LLL:** Jadikan fitur utama. User bisa tanya apa saja tentang teks yang sedang dibaca.

### 21. Academic Outline Generator + Essay Auditor
**Prompt asli:** Thesis statement + 3 argumen + kesimpulan. Audit: thesis strength, paragraph cohesion, evidence usage.  
**Adaptasi LLL:** Sangat berguna untuk mahasiswa. Bisa dipaketkan sebagai "Essay Mode" — dari outline sampai audit.

### 22. Critical Lens Applier
**Prompt asli:** Analisis teks dengan teori kritis (feminist, Marxist, dll) — level mahasiswa tingkat akhir.  
**Yang bagus:** Prompt-nya sangat spesifik tentang level akademis yang diharapkan.  
**Adaptasi LLL:** Fitur lanjutan (Phase 2). Penting untuk mahasiswa semester 5+. Sediakan pilihan lens yang common di kurikulum sastra Indonesia.

### 23. Plot Twist Generator
**Prompt asli:** Ringkasan novel + skenario what-if → jalan cerita alternatif + analisis dampak tema.  
**Adaptasi LLL:** Fitur fun yang meningkatkan engagement. Cocok untuk eksplorasi novel yang sedang dipelajari.

### 24. Literary Conflict Mapper
**Prompt asli:** Kategorikan tipe konflik + akar masalah + dampak psikologis tokoh.  
**Adaptasi LLL:** Berguna untuk analisis akademik. Bisa diintegrasi ke Reading Companion.

### 25. Story Mode Quiz
**Prompt asli:** Ambil 5 kata dari Lexicon user → buat cerita pendek pakai kata itu → 5 pertanyaan konteks.  
**Yang bagus:** Gamifikasi vocabulary yang sangat cerdas — kata dipelajari dalam konteks naratif.  
**Adaptasi LLL:** Pertahankan konsep. Di LLL, kata diambil dari Personal Vocabulary Bank user. Tambahkan pilihan genre cerita.

### 26. OCR Lens
**Prompt asli:** Groq Vision (llama-3.2-11b-vision-preview) + base64 image → ekstrak teks persis aslinya.  
**Catatan teknis:** Model vision Groq tersedia dan gratis di tier tertentu.  
**Adaptasi LLL:** Pertahankan persis. Sangat berguna untuk scan halaman buku fisik. Di Next.js, handle upload via FormData → API Route → Groq Vision.

---

## Fitur Lexicon Studio yang TIDAK perlu di LLL

- **Portfolio Case Study Generator** — terlalu spesifik untuk desainer, bukan mahasiswa sastra
- **Poem to Palette** — menarik tapi tidak langsung mendukung tujuan belajar bahasa
- **Semantic Visual Generator** — terlalu abstrak untuk konteks belajar

---

## Fitur BARU yang ada di LLL tapi tidak ada di Lexicon Studio

| Fitur | Alasan Penting |
|---|---|
| **Translation Workshop** | Core untuk mahasiswa penerjemahan — input terjemahan, dapat feedback nuansa |
| **User Auth + Multi-user** | Lexicon Studio single-user (Sheets), LLL multi-user dengan RLS |
| **Progress Dashboard** | Vocabulary mastery over time, CEFR progression |
| **Spaced Repetition dengan konteks** | Flashcard LLL menyimpan kalimat asli sebagai anchor, bukan kata kosong |
| **Text Library** | Koleksi teks sastra yang bisa dibuka langsung di app |

---

## Arsitektur Adaptasi (Lexicon Studio → LLL)

```
Lexicon Studio          →  Literary Language Lab
─────────────────────────────────────────────────
Apps Script doGet()     →  Next.js pages/
callGroq() server func  →  /api/groq/[feature].ts
Spreadsheet Archive     →  Supabase vocabulary table
Spreadsheet Tracker     →  Supabase reading_sessions
Spreadsheet Flashcards  →  Supabase vocabulary + SRS
google.script.run       →  fetch('/api/...')
HTML/CSS/JS inline      →  React components + Tailwind
```

---

## Prioritas Implementasi

### Phase 1 (MVP — langsung bisa dipakai kuliah)
1. Close Reading Mode + Word Lookup (Vibe Translator, Cultural Context, Nuance Detector)
2. OCR Lens (scan buku fisik)
3. Personal Vocabulary Bank + Spaced Repetition
4. Tone & Grammar Analyzer
5. Translation Workshop (fitur unggulan LLL)

### Phase 2 (setelah MVP stabil)
6. Rhetorical Devices Spotter
7. Dialect Diver
8. Paraphrase Challenge + scoring
9. Sentence Architect (color-coded)
10. Reading Companion
11. Academic Outline + Essay Auditor
12. Semantic Map (network graph)
13. Progress Dashboard + CEFR tracking

### Phase 3 (fitur lanjutan)
14. Critical Lens Applier
15. Literary Conflict Mapper
16. Story Mode Quiz (dari vocabulary bank user)
17. Era Translator + Literary Time Traveler
18. Alter Ego Chat

---

## Catatan Teknis Penting

**JSON parsing dari LLM:**  
Beberapa fitur (Semantic Map) meminta LLM output JSON murni. Selalu gunakan:
```typescript
const start = raw.indexOf('{');
const end = raw.lastIndexOf('}');
const parsed = JSON.parse(raw.substring(start, end + 1));
```
Tambahkan retry logic karena LLM kadang gagal format JSON.

**OCR di Next.js:**
```typescript
// API Route: /api/ocr
const formData = await req.formData();
const file = formData.get('image') as File;
const buffer = await file.arrayBuffer();
const base64 = Buffer.from(buffer).toString('base64');
// → kirim ke Groq Vision
```

**Rate limiting Groq:**  
Lexicon Studio tidak punya rate limiting. LLL harus tambahkan:
- 20 req/menit per user untuk AI endpoints
- Upstash Redis atau in-memory rate limiter di Next.js middleware

**System prompt:**  
Lexicon Studio pakai system prompt generik. LLL bisa personalisasi:
```
"You are an English literature tutor. The user is an Indonesian university student 
studying English Literature with a focus on translation. CEFR level: {user.level}.
Always explain in English with Indonesian translation for complex terms."
```

---

## Pola UI: Dropdown vs Tombol Grid vs Textarea Saja

### Fitur yang pakai Dropdown (`<select>`) di Lexicon Studio
Dropdown dipakai ketika ada preset pilihan yang mengubah *cara kerja* fitur secara signifikan:

| Fitur | Opsi Dropdown | Rekomendasi LLL |
|---|---|---|
| Grammar Fixer & Tone | Akademis Profesional / Sastra Puitis / Persuasif Marketing | Pertahankan + tambah "Penerjemahan" |
| Mood Transformer | Poetic / Melancholic / Suspenseful | Pertahankan + tambah Romantic / Gothic |
| Era Translator | Elizabethan / Victorian / Modernist | Tambah Romantic, Post-Colonial, Contemporary |
| Visual Moodboard | Dark Academia / Modern Minimalist / Cyberpunk | Opsional — bisa dihapus di LLL |
| Critical Lens | Feminism / Marxist / Psychoanalytic / Post-Col / Ecocriticism | Pertahankan persis — ini kurikulum standar |
| Alter-Ego Chat | Shakespeare / Jane Austen / Edgar Allan Poe | Tambah: Hemingway, Woolf, Achebe, Pramoedya |

### Fitur yang pakai Tombol Grid
Digunakan ketika user perlu memilih *mode analisis* yang berbeda untuk input yang sama:

- **Smart Lexicon** — 9 tombol: Dictionary, Translate, Rhyme, Quote, Lyricism, Metaphors, Etymology, Time Traveler, Semantic Map
- **Rekomendasi LLL**: Pertahankan pola tombol grid untuk Word Lookup. Tambahkan: Cultural Context, Nuance, Literary Synonyms sebagai tombol tambahan di grid yang sama. Satu input, banyak mode analisis — ini UX yang sangat efisien.

### Fitur tanpa pilihan (textarea + 1 tombol saja)
Untuk fitur yang punya satu tujuan spesifik dan tidak butuh konfigurasi:
Dialect Diver, Rhetorical Spotter, Vibe Translator, Diction Lab, Sentence Architect, Sentiment Spectrum, Imagery Sketcher, Poem-to-Palette, Literary Synonym, Nuance Detector, Literary Conflict Map, Paraphrase Challenge, Academic Outline, Essay Auditor, Plot Twist, Story Quiz, Flashcard.

### Rekomendasi Tambahan untuk LLL
- **Translation Workshop** (fitur baru) — tidak butuh dropdown, tapi butuh dua textarea: input terjemahan user + tombol evaluasi. Setelah evaluasi muncul, tampilkan skor + penjelasan nuansa yang hilang.
- **Reading Companion** — gunakan pola chat (input + send), bukan textarea + tombol. Lebih natural untuk tanya-jawab.
- **CEFR Level selector** — tambahkan dropdown global di header atau profile user: B1 / B2 / C1. Ini mempengaruhi kedalaman penjelasan di semua fitur AI.

---

## Lihat Juga
- [[PRD]] — PRD lengkap Literary Language Lab  
- [[Referensi_The_Lexicon_Studio]] — overview fitur Lexicon Studio
