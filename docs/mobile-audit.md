# Audit Mobile (Fase 2.5)

Lebar acuan: **375px**. Kriteria: tanpa scroll horizontal, target sentuh ≥ 44px, input tidak tertutup keyboard, teks terbaca.

**Metode (31 Okt 2026):** pemindaian kode otomatis untuk pola yang biasa merusak tampilan sempit
(padding `p-8`+ tanpa varian mobile, judul `text-4xl`+ tanpa varian mobile, `grid-cols-3`+ tanpa breakpoint,
lebar tetap > 360px, tabel tanpa `overflow-x-auto`). 160 kelas di 52 file diubah menjadi responsif
(mis. `p-8` → `p-4 md:p-8`, `text-4xl` → `text-2xl md:text-4xl`).

**Belum dilakukan:** pengecekan visual di browser / HP sungguhan. Sesi audit tidak punya `.env` dan akun uji,
jadi halaman yang butuh login belum dibuka. Kolom "Cek HP" diisi pemilik saat menguji.

Perubahan lintas halaman:
- Bottom nav: Beranda · Baca · Kosakata · Alat · Menu, tinggi 56px, aman untuk notch (`safe-area-pb`).
- Fokus keyboard terlihat (`:focus-visible`), animasi mati saat "kurangi gerakan" aktif.
- Komponen dasar baru di `components/ui/` (Button, Card, Input, Badge, EmptyState, Skeleton, Tabs, ResponsivePanel).

| Path | Temuan / perubahan | Status | Cek HP |
|---|---|---|---|
| `/dashboard` | Ditulis ulang: blok Lanjutkan Membaca, Kosa Kata Hari Ini, Progres Pribadi; tombol ≥ 44px | Diperbaiki | |
| `/library` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/gutenberg` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/lingowise` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/messages` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/profile` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/menu` | Pencarian fitur, grup bisa dilipat, grup Utama (Library, Gutenberg, A-Z, dll.) dan Admin | Diperbaiki | |
| `/settings` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/help` | Tidak ada temuan dari pemindaian kode | — | |
| `/library/add/ocr` | Fase 4: tombol Kamera/Galeri, kompresi gambar, scan multi-halaman | Diperbaiki | |
| `/read/[textId]` | Word Lookup jadi bottom sheet di < 1024px (ResponsivePanel) | Diperbaiki | |
| `/gutenberg/[id]` | Analisis Kalimat & Bookmark jadi bottom sheet di < 1024px | Diperbaiki | |
| `/admin/users` | Tabel masih scroll horizontal; versi kartu dijadwalkan di Fase 6 | Diperbaiki | |
| `/admin/providers` | Tidak ada temuan dari pemindaian kode | — | |
| `/admin/models` | Tidak ada temuan dari pemindaian kode | — | |
| `/admin/routing` | Tidak ada temuan dari pemindaian kode | — | |
| `/tools/dialect-diver` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/tone-analyzer` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/tone-detector` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/vibe-translator` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/mood-transformer` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/diction-lab` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/era-translator` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/sentence-architect` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/rhetorical-spotter` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/alter-ego` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/imagery-sketcher` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/semantic-visual` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/poem-to-palette` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/sentiment-spectrum` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/semantic-map` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/literary-synonyms` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/cultural-context` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/nuance-detector` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/metaphor-generator` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/idiom-detector` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/time-traveler` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/lexicon-search` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/vocabulary` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/idioms` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/review` | Tidak ada temuan dari pemindaian kode | — | |
| `/glossary` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/untranslatables` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/comparator` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/difficulty-analyzer` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/paraphrase` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/imagery-grader` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/character-monologue` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/academic-outline` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/writing-assistant` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/story-quiz` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/plot-twist` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/conflict-mapper` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/critical-lens` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/english-lab/grammar-clinic` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/english-lab/flashcard` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/english-lab/dialogue-simulator` | Tidak ada temuan dari pemindaian kode | — | |
| `/english-lab/listening-test` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/pronunciation-clinic` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/english-lab/slang-decoder` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/english-lab/placement-test` | Tidak ada temuan dari pemindaian kode | — | |
| `/translation-workshop` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/translation-memory` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/tools/parallel-text` | Tidak ada temuan dari pemindaian kode | — | |
| `/tools/translation-timelapse` | Tidak ada temuan dari pemindaian kode | — | |
| `/tools/annotations` | Tidak ada temuan dari pemindaian kode | — | |
| `/history` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/forum` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/community` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
| `/community-annotations` | Tidak ada temuan dari pemindaian kode | — | |
| `/clubs` | Padding/judul terlalu besar di 375px | Diperbaiki otomatis | |
