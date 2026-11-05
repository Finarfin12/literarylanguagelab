# Tinjauan RLS produksi (Fase 19.1)

Sumber: hasil query `pg_policies` dan `pg_class.relrowsecurity` yang dijalankan pemilik pada 5 Nov 2026. Hasil `pg_policies` **terpotong di tabel `texts`**: policy `texts` SELECT/UPDATE dan semua tabel setelahnya (mis. `translations`, `translation_*`, `unit_progress`, `user_follows`, `vocabulary`, `writing_submissions`) **belum ditinjau**.

RLS aktif di seluruh 64 tabel `public`.

## Temuan

| # | Tabel | Masalah | Tingkat | Status |
|---|---|---|---|---|
| 1 | `texts` | DELETE `is_public = true` untuk role `public`: anon bisa menghapus teks publik | Tinggi | Diperbaiki di `0018` blok A (belum dijalankan) |
| 2 | `texts` | INSERT `with_check = true` (authenticated) dan `is_public = true` (public): anon/siapa pun bisa menyisipkan teks publik | Tinggi | Diperbaiki di blok A; pengguna hanya boleh teks pribadi (`owner_id = auth.uid()`, `is_public = false`) |
| 3 | `group_discussions` | INSERT: `group_members.group_id = group_members.group_id` (tautologi), anggota grup mana pun bisa posting di grup mana pun | Tinggi | Diperbaiki di `0018` blok B (belum dijalankan) |
| 4 | `direct_messages` | UPDATE oleh penerima tanpa batas kolom: isi pesan bisa dipalsukan | Sedang | Diperbaiki di blok C: trigger hanya mengizinkan perubahan `is_read` (belum dijalankan) |
| 5 | `messages` | ALL untuk pengirim/penerima; sisipan atas nama orang lain mungkin. Tidak dipakai kode | Sedang | Diperbaiki di blok C: policy ALL diganti baca/hapus saja (belum dijalankan) |
| 6 | `profiles` | SELECT `true` (anon membaca semua kolom, termasuk `role`); UPDATE bergantung pada trigger `0002` yang tak terlihat di `pg_policies` | Sedang | Diperbaiki di blok E: SELECT hanya `authenticated`; `/p/[username]` membaca kolom publik lewat service client (belum dijalankan) |
| 7 | `system_config` | SELECT `true`: anon membaca `features`, `rate_limits` | Sedang | Diperbaiki di blok D: SELECT hanya `authenticated` (belum dijalankan) |
| 8 | `cultural_references` | INSERT terbuka bagi semua pengguna login | Rendah | Dibiarkan |
| 9 | `ai_usage_logs` | Pengguna bisa mengisi sendiri | Rendah | Tidak berdampak setelah `0019` |
| 10 | `translation_duels`, `user_badges`, `weekly_prompts` | Tabel peninggalan gamifikasi masih ada di produksi (tidak ada di migrasi repo, tidak dipakai kode) | Info | Bukan bagian `0018`; migrasi terpisah bila pemilik setuju |
| 11 | `texts` | Fitur OCR (`library/add/ocr`) memanggil `/api/texts` yang **tidak ada** di repo (404) | Info | Diperbaiki: route `app/api/texts` dibuat, menyimpan teks pribadi |

## Keputusan pemilik (5 Nov 2026)

- Tulis/ubah/hapus `texts` lewat database hanya untuk admin.
- Fitur "Tambah teks" pengguna biasa **tetap ada**, tetapi hasilnya teks pribadi (opsi 1): `addText` mengisi `owner_id` dan `is_public = false`; Library menampilkan teks pribadi kepada pemiliknya; admin yang menerbitkan.
- Cache `key_vocabulary` ditulis lewat service client karena UPDATE `texts` menjadi admin-only.

## Hasil uji per tabel

**Perlu diuji pemilik** dengan akun uji (bukan akun produksi nyata) setelah `0018` dijalankan:

| Tabel | anon | pemilik data | pengguna lain | admin |
|---|---|---|---|---|
| `texts` baca teks publik | boleh | boleh | boleh | boleh |
| `texts` tambah teks pribadi | ditolak | boleh (`is_public=false`, `owner_id` sendiri) | n/a | boleh |
| `texts` tambah teks publik | ditolak | ditolak | n/a | boleh |
| `texts` ubah / hapus | ditolak | ditolak | ditolak | boleh |
| `texts` baca teks pribadi | ditolak | boleh | ditolak | boleh |

Uji tambahan setelah blok B–D (akun uji):

- B: anggota grup X tidak bisa memposting di grup Y; tetap bisa di grup X.
- C: penerima bisa menandai pesan terbaca; mencoba mengubah `content` lewat API ditolak (`42501`); pengirim/penerima tetap bisa menghapus.
- E: portofolio `/p/<username>` terbuka tanpa login masih tampil; pengguna login masih melihat profil lain di komunitas; permintaan anon langsung ke tabel `profiles` kosong.
- D: pengguna login masih bisa memakai fitur AI (batas pemakaian terbaca); permintaan anon ke `system_config` kosong.

Tabel lain: belum diuji (policy belum diubah).

## Urutan menjalankan `0018` (blok A–D, satu per satu)

1. Deploy kode terbaru (addText, Library, route vocab).
2. Jalankan blok demi blok dari `0018_rls_baseline.sql` di SQL Editor (A–E, masing-masing diuji).
3. Uji dengan akun uji: tambah teks lewat `/library/add` (harus tersimpan pribadi dan tampil bagi akun itu saja), buka Library dengan akun lain (tidak tampil), coba hapus teks dari akun biasa (harus gagal).
4. Rollback: SQL ada di komentar bagian atas `0018`.
