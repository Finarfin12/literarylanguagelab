-- Migration 0018: perbaikan RLS berdasarkan tinjauan policy produksi (Fase 19.1, disetujui pemilik 5 Nov 2026).
-- Aman dijalankan ulang. SEKARANG HANYA BLOK A (tabel texts). Blok B–D (group_discussions, direct_messages/messages,
-- profiles/system_config) menunggu persetujuan pemilik dan policy tabel setelah `texts` yang belum ditinjau;
-- jangan ditambahkan di sini tanpa itu. Hasil tinjauan: docs/v5/rls-check.md.
--
-- Bergantung pada: 0002 (fungsi is_admin()). Dijalankan SETELAH kode baru ter-deploy (addText memakai kolom owner_id,
-- dengan cadangan ke perilaku lama bila kolom belum ada).
--
-- Dampak yang diharapkan setelah blok A:
--   * anon dan pengguna biasa TIDAK bisa menghapus atau mengubah baris texts; hanya admin.
--   * pengguna login bisa menambah teks sendiri (Library → Tambah teks), tetapi hanya sebagai teks PRIBADI
--     (is_public = false, owner_id = dirinya). Teks publik hanya dibuat/diterbitkan admin.
--   * pemilik tetap bisa melihat teks pribadinya.
--
-- ROLLBACK blok A (mengembalikan policy produksi lama; hanya bila benar-benar perlu):
--   DROP POLICY IF EXISTS "Users insert own private texts" ON texts;
--   DROP POLICY IF EXISTS "Owners read own texts" ON texts;
--   DROP POLICY IF EXISTS "Admins manage texts" ON texts;
--   CREATE POLICY "Users can delete texts" ON texts FOR DELETE TO public USING (is_public = true);
--   CREATE POLICY "Anyone can insert texts" ON texts FOR INSERT TO authenticated WITH CHECK (true);
--   CREATE POLICY "Users can insert texts" ON texts FOR INSERT TO public WITH CHECK (is_public = true);
--   -- (kolom owner_id sengaja dibiarkan; DROP COLUMN texts.owner_id bila ingin bersih)

-- ===== BLOK A: texts =====

-- Pemilik teks pribadi. NULL untuk teks yang sudah ada (milik perpustakaan / admin).
ALTER TABLE texts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_texts_owner ON texts (owner_id) WHERE owner_id IS NOT NULL;

ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

-- Tutup policy yang terlalu longgar (produksi): siapa pun bisa menghapus teks publik dan menyisipkan teks publik.
DROP POLICY IF EXISTS "Users can delete texts" ON texts;
DROP POLICY IF EXISTS "Anyone can insert texts" ON texts;
DROP POLICY IF EXISTS "Users can insert texts" ON texts;

-- Admin: semua operasi (menerbitkan, mengedit, menghapus). Dipakai Admin → Konten dan deleteText.
DROP POLICY IF EXISTS "Admins manage texts" ON texts;
CREATE POLICY "Admins manage texts" ON texts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pengguna login boleh menambah teks, tetapi hanya pribadi dan atas namanya sendiri.
DROP POLICY IF EXISTS "Users insert own private texts" ON texts;
CREATE POLICY "Users insert own private texts" ON texts
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND is_public = false);

-- Pemilik boleh membaca teks pribadinya (policy SELECT yang sudah ada tidak diubah).
DROP POLICY IF EXISTS "Owners read own texts" ON texts;
CREATE POLICY "Owners read own texts" ON texts
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- CATATAN: policy UPDATE/SELECT lain pada texts di produksi belum ditinjau (hasil query terpotong).
-- Bila ada policy UPDATE longgar, ia tetap berlaku sampai ditinjau dan dihapus di blok terpisah.
