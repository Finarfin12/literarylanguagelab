# DESIGN.md — Sistem Desain Literary Language Lab v4

> **Sumber acuan tunggal untuk tampilan.** PRD menjelaskan *apa* dan *mengapa*; dokumen ini menjelaskan *seperti apa*. Jika PRD, plan, atau mockup berbeda dengan dokumen ini dalam hal visual, **dokumen ini yang berlaku**.
>
> Aturan di atas segalanya: **redesign hanya mengubah tampilan** — lihat [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md). Tidak ada komponen di sini yang boleh dipakai untuk menghapus atau menyembunyikan fitur.
>
> Mockup arah: https://claude.ai/artifact/LSVnAAWiTKUCJKhjUnd6Zx (kanvas pribadi pemilik).

---

## 1. Prinsip

| # | Prinsip | Artinya dalam praktik |
|---|---|---|
| D1 | **Perpustakaan akademis** | Latar kertas hangat, judul serif seperti bab buku, label kecil bergaya katalog, garis tipis alih-alih bayangan tebal |
| D2 | **Ramah untuk pemula** | Satu aksi utama per kartu, bahasa Indonesia jelas, target sentuh besar, langkah berikutnya selalu terlihat |
| D3 | **Rapi** | Grid dan jarak konsisten, tanpa dekorasi yang tidak membawa informasi |
| D4 | **Teks adalah tokoh utama** | Area baca paling tenang di seluruh aplikasi: tanpa blur, glow, atau animasi |
| D5 | **Semua tema setara** | Terang, gelap, sepia (reader), kontras tinggi, font disleksia — dirancang, bukan sekadar dibalik warnanya |

**Dilarang:** glow (`shadow-[0_0_…]` berwarna), gradasi latar dekoratif, `backdrop-blur` pada kartu, efek hover melompat (`-translate-y`), warna neon per kategori, emoji sebagai ikon, kartu bergaris kiri tebal sebagai hiasan.

---

## 2. Tipografi

### 2.1 Keluarga huruf

| Peran | Huruf | Sumber & lisensi | Dipakai untuk |
|---|---|---|---|
| **Serif** (`--font-serif`) | **Michelangelus** → cadangan **Alegreya** → Georgia, serif | Michelangelus: © Gusto IDS / Microsoft, lisensi untuk Microsoft 365 — **tidak boleh di-host di server** (lihat 2.2). Alegreya: SIL OFL (Google Fonts) | Judul halaman & bagian, judul buku, teks bacaan (pilihan "serif" di reader), kata di Word Lookup |
| **Sans-serif** (`--font-sans`) | **Source Sans 3** → system-ui, sans-serif | SIL OFL (Google Fonts) | Semua UI: menu, tombol, label, formulir, isi kartu, tabel admin |
| Disleksia (reader) | OpenDyslexic → Comic Sans MS → sans-serif | sudah ada di reader | Pilihan `font_family: "dyslexic"` — **tetap** |

**Mengapa pasangan ini:** Michelangelus adalah serif "abadi" yang diturunkan dari tulisan tangan Michelangelo, dengan italic berciri kaligrafi. Pasangan terbaiknya adalah **sans humanis** (bentuk huruf mengikuti goresan pena, bukan geometri murni) agar keduanya terasa satu keluarga: Source Sans 3 humanis, sangat terbaca di ukuran kecil, punya banyak ketebalan, dan angka rata (lining) yang rapi untuk UI. Alegreya dipilih sebagai cadangan serif karena juga humanis-kaligrafis berakar Renaisans, sehingga tampilan tetap berkarakter di perangkat tanpa Michelangelus.

> **Yang dilihat kebanyakan pengguna adalah Alegreya.** Lewat `local()`, Michelangelus hanya tampil di perangkat yang sudah memasangnya (mis. pengguna Microsoft 365). Karena itu **ukuran, tinggi baris, dan tata letak disetel dengan Alegreya**, lalu Michelangelus diuji sebagai variasi (tidak boleh membuat teks terpotong atau melimpah). Agar semua pengguna melihat Michelangelus, perlu lisensi webfont tertulis (§2.2 butir 3).

### 2.2 Lisensi Michelangelus — aturan pemakaian (wajib)

Fakta (dicek 31 Okt 2026):
- Dibuat studiogusto untuk Takhta Suci, **dilisensikan & didistribusikan Microsoft** "for use in Microsoft 365 applications" ([Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=108856), [studiogusto](https://michelangelus.studiogusto.com/)).
- Teks di dalam file font: *"Copyright © 2024 by Gusto IDS. All rights reserved."* — tanpa teks lisensi web. `fsType = 0` hanya mengatur penyematan di dokumen, **bukan izin webfont**.
- Aturan umum font Microsoft melarang menyalin file font ke server web atau mengubahnya ke WOFF ([Microsoft font FAQ](https://learn.microsoft.com/en-us/typography/fonts/font-faq)); belum ada pernyataan resmi khusus Michelangelus untuk situs web.

Karena itu:
1. **Jangan** menaruh file Michelangelus di repo, `public/`, CDN, atau artifact; **jangan** mengonversi ke WOFF/WOFF2; **jangan** memakai `next/font/local` untuknya.
2. Pakai **hanya lewat `local()`** — tampil bila sudah terpasang di perangkat pengguna (mis. pengguna Microsoft 365), selain itu jatuh ke Alegreya:
   ```css
   @font-face {
     font-family: "Michelangelus Local";
     src: local("Michelangelus"), local("Michelangelus Regular"), local("Michelangelus-Regular");
     font-weight: 400; font-style: normal; font-display: swap;
   }
   /* ulangi untuk 700 normal (Bold), 400 italic (Italic), 700 italic (Bold Italic) */
   ```
   `--font-serif: "Michelangelus Local", var(--font-alegreya), Georgia, serif;`
3. Jika suatu saat pemilik memperoleh **lisensi webfont tertulis** dari Microsoft/Fabbrica di San Pietro, baru boleh di-host — perbarui bagian ini dan simpan bukti lisensinya di repo (`docs/licenses/`).
4. Atribusi singkat di halaman Bantuan: "Huruf: Michelangelus (studiogusto/Microsoft, bila terpasang), Alegreya & Source Sans 3 (SIL Open Font License)".

### 2.3 Skala

Basis 16px. Satuan `rem`. Judul memakai serif, sisanya sans.

| Token | Ukuran HP / desktop | Tinggi baris | Huruf & tebal | Contoh |
|---|---|---|---|---|
| `display` | 32 / 44 px | 1.1 | serif 500 | Sapaan Beranda, judul landing |
| `h1` | 28 / 36 px | 1.15 | serif 500 | Judul halaman |
| `h2` | 22 / 26 px | 1.2 | serif 500 | Judul bagian ("Lanjutkan membaca") |
| `h3` | 18 / 20 px | 1.25 | serif 500 | Judul kartu, judul buku |
| `body` | 15 / 16 px | 1.6 | sans 400 | Isi UI |
| `small` | 13 / 14 px | 1.5 | sans 400 | Keterangan, metadata |
| `eyebrow` | 11 / 12 px | 1.3 | sans 700, kapital, `letter-spacing: .14em` | "LANGKAH BERIKUTNYA", "RUANG I" |
| `reading` | 19 / 20 px (diatur pengguna) | 1.75 (diatur pengguna) | serif 400 | Teks bacaan reader |

Angka di UI (statistik, progres, halaman): `font-variant-numeric: lining-nums tabular-nums`.

---

## 3. Warna

**Palet tetap seperti sekarang** (keputusan pemilik). Hijau brand dipertahankan; turunan gelap dipakai di tempat yang butuh kontras teks. Semua nilai di bawah sudah dihitung rasio kontrasnya (WCAG 2.1).

### 3.1 Terang (`:root`)

| Token | Nilai | Dipakai untuk | Kontras |
|---|---|---|---|
| `--background` | `#F6F2E9` | Latar halaman ("kertas") | — |
| `--card` | `#FFFFFF` | Kartu, panel, bottom sheet | — |
| `--foreground` | `#1F2420` | Teks utama | 14.1 di background, 15.8 di card |
| `--muted-foreground` | `#5E5A50` | Teks sekunder, metadata | 6.2 / 6.9 ✅ |
| `--border` | `#E2DBCB` | Garis kartu & pemisah | dekoratif |
| `--muted` | `#F1ECDF` | Latar sidebar, chip netral | — |
| `--brand` | `#2FA16B` | **Aksen non-teks saja**: progress bar, ikon besar, sampul, titik penanda | 2.9 (bukan untuk teks) |
| `--brand-ink` (baru) | `#1E6B45` | Teks berwarna hijau, link, eyebrow aktif | 5.8 / 6.5 ✅ |
| `--brand-solid` (baru) | `#22804F` | Latar tombol utama (teks putih) | putih di atasnya 4.9 ✅ |
| `--brand-tint` (baru) | `#E3EFE6` | Latar chip aktif / sorotan kata | brand-ink di atasnya 5.5 ✅ |
| `--danger` | `#B42318` | Error, tombol hapus | 6.6 ✅ |

> Catatan: `#2FA16B` sebagai latar tombol berteks putih hanya 3.3:1 (gagal AA) — karena itu tombol memakai `--brand-solid`.

### 3.2 Gelap (`.dark`) — "tinta hangat"

| Token | Nilai | Kontras |
|---|---|---|
| `--background` | `#17150F` | — |
| `--card` | `#211E17` | — |
| `--foreground` | `#EDE6D6` | 14.7 / 13.4 ✅ |
| `--muted-foreground` | `#B3AB98` | 8.0 / 7.3 ✅ |
| `--border` | `#3A352A` | dekoratif |
| `--muted` | `#2A261D` | — |
| `--brand` / `--brand-ink` | `#3ECF8E` | 9.1 / 8.3 ✅ (boleh untuk teks di tema gelap) |
| `--brand-solid` | `#3ECF8E` dengan teks `#17150F` | 9.1 ✅ |
| `--brand-tint` | `#1D3A2B` | — |
| `--danger` | `#F87171` | 6.0 ✅ |

### 3.3 Tema reader

| Tema | Latar | Teks | Kontras |
|---|---|---|---|
| Terang | `#FBF8F1` | `#2A2620` | ✅ |
| Sepia | `#F4ECD8` | `#43352A` (lama `#5B4636` = 7.5, tetap lolos) | 10.0 ✅ |
| Gelap | `#17150F` | `#EDE6D6` | 14.7 ✅ |
| Kontras tinggi | `#000000` / `#FFFFFF` | `#FFFF00` / `#000000` | 19.6 ✅ — **tetap seperti sekarang** |

`highlight_color` pilihan pengguna tetap dipakai untuk seleksi teks.

### 3.4 Warna semantik & pengganti warna kategori

Aplikasi lama memberi tiap kategori/alat warna sendiri (`purple-500`, `emerald-500`, `orange-500`, …; ±50 file). v4 **membedakan kategori lewat ikon, label, dan urutan**, bukan warna. Warna hanya untuk makna.

Token baru (tambahkan di `:root` dan `.dark`):

| Token | Terang | Gelap | Kontras |
|---|---|---|---|
| `--warning-ink` | `#8A5A00` | `#E5B45A` | terang 5.9 di card, 5.3 di background, 5.2 di tint ✅; gelap 8.7 di card, 9.6 di background ✅ |
| `--warning-tint` | `#FBF0D9` | `#3A2E14` | warning-ink di atasnya 5.2 / 7.0 ✅ |
| `--danger-tint` | `#FBE9E7` | `#3A1A17` | danger di atasnya 5.6 / 5.7 ✅ |

Pemetaan untuk skrip `v4-restyle` (Fase 12.4):

| Kelas lama (warna apa pun dengan angka) | Makna | Pengganti |
|---|---|---|
| `red-*` | error, hapus, jawaban salah | `text-danger`, `bg-danger-tint`, `border-danger/30` |
| `amber-*`, `yellow-*`, `orange-*` dipakai untuk peringatan/draft | peringatan, draft, kuota hampir habis | `text-warning-ink`, `bg-warning-tint`, `border-warning-ink/30` |
| `green-*`, `emerald-*` | sukses, benar, terbit, aktif | `text-brand-ink`, `bg-brand-tint`, `border-brand/30` |
| `blue-*`, `sky-*` | info, tautan | `text-brand-ink` (tautan) atau `text-muted-foreground` + `bg-muted` (info) |
| `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`, `rose-*`, `indigo-*`, `cyan-*`, `teal-*`, `lime-*`, `orange-*` sebagai warna kategori | identitas alat/kategori (dekoratif) | ikon `text-foreground` atau `text-brand-ink` (aktif), latar `bg-muted`, garis `border-border` |
| `from-*`/`via-*`/`to-*` (gradasi) | dekoratif | hapus; pakai `bg-card` / `bg-muted` |

**Pengecualian — warna yang membawa informasi tetap berbeda-beda** (jangan diganti skrip; ditinjau di sub-fase 14 dan cukup diperiksa kontrasnya): warna sorotan & `highlight_color` pilihan pengguna, pemilih warna anotasi, warna kelas kata / analisis kalimat, tanda diff (tambah/hapus), seri grafik admin, tema reader.

---

## 4. Ruang, bentuk, garis

| Hal | Nilai |
|---|---|
| Skala jarak | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 px |
| Gutter halaman | 16 px HP, 24 px tablet, `clamp(20px, 5vw, 72px)` desktop |
| Lebar isi | Beranda/ruang maks 960 px; reader mengikuti `text_width` pengguna (narrow 576 / medium 768 / wide 1024 px) |
| Radius | kontrol 10–12 px (`--radius-control`), kartu 16 px (`--radius-card`), chip 999 px |
| Garis | 1 px `--border`; pemisah dalam kartu `#EDE6D6` (terang) |
| Bayangan | Hampir tidak ada. Kartu: tanpa bayangan atau `0 1px 0 var(--border)`. Hanya elemen melayang (bottom sheet, Tongkat Ajaib, menu dropdown) yang boleh berbayangan lembut |
| Target sentuh | ≥ 44 × 44 px (tombol utama 48 px di HP) |

---

## 5. Ikon

- Ikon garis `lucide-react` (sudah dipakai), stroke 1.75–2, ukuran 16/18/20 px.
- Ikon tanpa teks wajib `aria-label`. Ikon dekoratif `aria-hidden`.
- Jangan memakai emoji sebagai ikon (kecuali konten buatan pengguna).

---

## 6. Tata letak

### 6.1 Desktop (≥ 1024 px)
- **Sidebar** 240–280 px, latar `--muted`, garis kanan: logo → Beranda → *Ruang* (I Belajar Dasar, II Baca & Kajian Sastra, III Ruang Terjemah) → *Koleksi saya* → *Komunitas* → Semua alat → Admin (khusus admin) → kartu Word of the Day & level → pengguna. Tetap bisa diciutkan.
- Konten: header halaman (eyebrow + `h1` serif + satu kalimat pengantar), lalu bagian-bagian dengan `h2` serif.
- Panel samping (Word Lookup, Analisis, Bookmark) memakai `ResponsivePanel` di kanan.

### 6.2 HP (< 1024 px)
- Header ringkas (logo + pencarian), konten satu kolom, **bottom nav** 5 tujuan (keputusan Q1 di PRD).
- Panel = bottom sheet (`ResponsivePanel`) dengan pegangan di atas.
- Tidak ada scroll horizontal di 375 px; tabel admin menjadi kartu.

### 6.3 Pola halaman

| Jenis halaman | Susunan |
|---|---|
| **Beranda** | Sapaan (display serif) → kartu **Langkah berikutnya** (lebar) + **Kosa kata hari ini** → **Lanjutkan membaca** (rak dengan sampul) → **Tiga ruang belajar** |
| **Pembuka Ruang** | Eyebrow "Ruang I/II/III" → judul → pengantar → daftar alat **bernomor seperti daftar isi**, dikelompokkan per tahap, tiap item ber-deskripsi satu baris |
| **Halaman alat** | Judul + deskripsi → input (dengan "Coba dengan contoh") → tombol utama → hasil dalam kartu bertipografi baca |
| **Reader** | Header tipis (kembali, judul, Hal x/y, Aa) → progress 3 px → halaman "kertas" → navigasi halaman di bawah |
| **Daftar / koleksi** | Pencarian + filter chip → daftar kartu/baris; keadaan kosong memakai `EmptyState` dengan aksi |
| **Formulir & Pengaturan** | Kelompok berjudul `h2`, label di atas input, keterangan `small`, satu tombol simpan per kelompok |
| **Admin** | Tab horizontal; tabel di desktop, kartu di HP |

---

## 7. Komponen

Semua di `components/ui/` (fondasi dari v2). **Props yang ada tidak boleh berubah**; hanya gaya.

| Komponen | Spesifikasi v4 |
|---|---|
| `Button` primary | Latar `--brand-solid`, teks putih (gelap: teks `--background`), radius 12, tinggi ≥ 44 (48 di HP untuk aksi utama), sans 600 |
| `Button` secondary | Latar `--card`, garis `#D8D0BE`, teks `--foreground` |
| `Button` ghost / danger | Ghost: tanpa latar, teks `--muted-foreground`. Danger: latar `danger/10`, teks `--danger` |
| `Card` | Latar `--card`, garis 1 px, radius 16, padding 20–28; tanpa bayangan |
| `Eyebrow` (baru) | `eyebrow` style, warna `--muted-foreground`; versi aktif `--brand-ink` |
| `SectionHeading` (baru) | `h2` serif + aksi kanan opsional ("Rak bacaan →") |
| `BookSpine` (baru) | Sampul sederhana: persegi panjang warna tenang + bayangan dalam di kiri (punggung buku); dipakai di rak bacaan |
| `Badge` | Level CEFR: latar `--brand-tint`, teks `--brand-ink`; netral: `--muted` |
| `Input` | Tinggi 44, latar `--card`, garis `#D8D0BE`, fokus garis `--brand-solid` + ring 2 px |
| `Tabs` | Garis bawah 2 px `--brand-solid` untuk aktif, teks `--muted-foreground` untuk lainnya |
| `ResponsivePanel` | Bottom sheet radius atas 20, pegangan 40×5; samping 400–450 px di desktop; bayangan hanya saat terbuka |
| `ProgressBar` | Tinggi 3–4 px, jalur `#EDE6D6`, isi `--brand` |
| Mode grid (Word Lookup) | 16 tombol, 4 kolom di HP (min-height 44), 3–4 kolom di desktop; aktif: garis & teks hijau + latar `--brand-tint`; **urutan & nama mode tidak berubah** |
| **Tongkat Ajaib** (`MagicWandButton`) | Lingkaran 56 px; nonaktif: latar `--card`, garis, ikon `--foreground`; aktif: latar `--brand-solid`, ikon putih, ring lembut. Bisa digeser, menempel ke tepi kiri/kanan (jarak 12 px), `touch-action: none`, kursor grab. Perilaku: PRD §5.4 |
| Penanda idiom (14f) | Garis bawah putus-putus `--brand` 2 px, tooltip kartu kecil; berbeda dari referensi budaya (amber) |

---

## 8. Gerak

- Durasi 150–250 ms, `ease-out`; bottom sheet 300–500 ms (kurva yang sudah ada).
- Tidak ada animasi di area baca kecuali transisi halaman yang halus.
- Hormati `prefers-reduced-motion` dan preferensi `enable_animations` (sudah ada di `AnimatedPage`).

---

## 9. Aksesibilitas

- Kontras: semua teks ≥ 4.5:1 (teks ≥ 24 px atau tebal ≥ 19 px: ≥ 3:1) di semua tema — uji `tests/contrast.test.mts` (Fase 12).
- Fokus keyboard terlihat (`:focus-visible` garis `--brand-solid`).
- Elemen interaktif asli (`<button>`, `<a href>`, `<input>` + `<label>`); jangan `onClick` di `<div>`.
- Warna tidak menjadi satu-satunya pembeda (tambahkan ikon/teks).

---

## 10. Pemetaan ke kode

| Bagian | File |
|---|---|
| Token warna, radius, utilitas | `app/globals.css` (`:root`, `.dark`, `@theme inline`) — **ubah nilai, jangan ganti nama token lama** |
| Huruf | `app/layout.tsx`: ganti `Inter` → `Source_Sans_3` (`--font-sans`), `Merriweather` → `Alegreya` (`--font-alegreya`); `@font-face` `local()` Michelangelus di `globals.css`; `--font-serif` = stack di §2.2 |
| Komponen | `components/ui/primitives.tsx`, `Tabs.tsx`, `ResponsivePanel.tsx`; komponen baru `Eyebrow`, `SectionHeading`, `BookSpine` |
| Reader | `components/reader/*` — tema reader, `ReaderBlock`, Word Lookup, `MagicWandButton` |
| Navigasi | `components/Sidebar.tsx`, `components/MobileBottomNav.tsx`, `app/(dashboard)/menu/page.tsx`, `lib/menu-config.ts` |

## 11. Riwayat keputusan

| Tanggal | Keputusan |
|---|---|
| 31 Okt 2026 | Arah "perpustakaan akademis yang ramah, rapi"; warna tetap; untuk tiga kelompok pengguna |
| 31 Okt 2026 | Redesign hanya tampilan — tidak ada fitur yang dihapus |
| 31 Okt 2026 | Serif: **Michelangelus** (pilihan pemilik) lewat `local()` karena lisensi web belum ada; cadangan Alegreya; sans: Source Sans 3 |
| 31 Okt 2026 | Tongkat Ajaib bisa digeser |
| 1 Nov 2026 | Tata letak disetel dengan Alegreya (yang dilihat kebanyakan pengguna); Michelangelus diuji sebagai variasi |
| 1 Nov 2026 | Warna kategori/neon diganti token semantik (§3.4); kategori dibedakan lewat ikon & label |
| 1 Nov 2026 | Bottom nav HP: Beranda · Baca · Kosakata · Ruang · Menu |
