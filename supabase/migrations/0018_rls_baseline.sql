-- Migration 0018: perbaikan RLS berdasarkan tinjauan policy produksi (Fase 19.1, disetujui pemilik 5 Nov 2026).
-- Aman dijalankan ulang. Setiap blok berdiri sendiri: jalankan SATU PER SATU dan uji dengan akun uji di antaranya.
--   Blok A: texts (teks publik tidak bisa diubah/dihapus anon; pengguna hanya menambah teks pribadi)
--   Blok B: group_discussions (perbaiki syarat keanggotaan grup)
--   Blok C: direct_messages (penerima hanya boleh mengubah penanda baca) dan messages (tabel lama, hanya baca/hapus)
--   Blok D: system_config (anon tidak lagi bisa membaca)
--   Blok E: profiles (SELECT hanya pengguna login; portofolio publik membaca kolom publik lewat service client)
-- TIDAK termasuk: policy tabel setelah `texts` yang belum ditinjau (hasil query terpotong).
-- Hasil tinjauan: docs/v5/rls-check.md.
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

-- ===== BLOK B: group_discussions =====
-- Produksi: WITH CHECK membandingkan group_members.group_id dengan dirinya sendiri (selalu benar), jadi anggota
-- grup mana pun bisa memposting di grup lain. Perbaikan: grup tujuan harus grup tempat pengirim menjadi anggota.
--
-- ROLLBACK blok B:
--   DROP POLICY IF EXISTS "Members can post discussions" ON group_discussions;
--   CREATE POLICY "Members can post discussions" ON group_discussions FOR INSERT TO public
--     WITH CHECK ((auth.uid() = user_id) AND (EXISTS (SELECT 1 FROM group_members
--       WHERE group_members.group_id = group_members.group_id AND group_members.user_id = auth.uid())));

ALTER TABLE group_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can post discussions" ON group_discussions;
CREATE POLICY "Members can post discussions" ON group_discussions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_discussions.group_id AND gm.user_id = auth.uid()
    )
  );

-- ===== BLOK C: direct_messages dan messages =====
-- direct_messages: penerima boleh UPDATE (policy yang ada), tetapi RLS tidak bisa membatasi kolom. Trigger di bawah
-- menolak perubahan apa pun selain kolom is_read, sehingga isi/pengirim/penerima pesan tidak bisa dipalsukan.
-- (Aplikasi hanya mengubah is_read: messages/page.tsx.) Service role tidak terkena trigger bila auth.uid() NULL.
--
-- ROLLBACK blok C:
--   DROP TRIGGER IF EXISTS trg_dm_only_read_flag ON direct_messages;
--   DROP FUNCTION IF EXISTS dm_only_read_flag();
--   DROP POLICY IF EXISTS "Participants read own messages" ON messages;
--   DROP POLICY IF EXISTS "Participants delete own messages" ON messages;
--   CREATE POLICY "Users can access own messages" ON messages FOR ALL TO public
--     USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

CREATE OR REPLACE FUNCTION dm_only_read_flag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND (to_jsonb(NEW) - 'is_read') IS DISTINCT FROM (to_jsonb(OLD) - 'is_read') THEN
    RAISE EXCEPTION 'Hanya penanda baca yang boleh diubah pada pesan.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dm_only_read_flag ON direct_messages;
CREATE TRIGGER trg_dm_only_read_flag
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION dm_only_read_flag();

-- messages: tabel lama yang tidak dipakai kode. Policy ALL membolehkan menyisipkan pesan atas nama orang lain
-- (WITH CHECK default = USING). Diganti: peserta hanya boleh membaca dan menghapus.
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own messages" ON messages;
DROP POLICY IF EXISTS "Participants read own messages" ON messages;
CREATE POLICY "Participants read own messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Participants delete own messages" ON messages;
CREATE POLICY "Participants delete own messages" ON messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ===== BLOK D: system_config =====
-- Produksi: SELECT true untuk semua role, jadi anon bisa membaca features/rate_limits. Semua pembacaan di aplikasi
-- dilakukan pengguna yang sudah login (getRateLimit, ai-config) atau service role (flag), jadi dibatasi ke authenticated.
--
-- ROLLBACK blok D:
--   DROP POLICY IF EXISTS "Authenticated read system config" ON system_config;
--   CREATE POLICY "Everyone can read system config" ON system_config FOR SELECT TO public USING (true);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read system config" ON system_config;
DROP POLICY IF EXISTS "Authenticated read system config" ON system_config;
CREATE POLICY "Authenticated read system config" ON system_config
  FOR SELECT TO authenticated
  USING (true);

-- ===== BLOK E: profiles =====
-- Produksi: SELECT true untuk semua role, jadi anon bisa membaca semua kolom semua profil lewat API. Portofolio publik
-- /p/[username] kini membaca kolom publik (id, username, full_name, avatar_url, cefr_level, vocab_count) lewat
-- service client, jadi SELECT dibatasi ke pengguna login. Pengguna login tetap bisa melihat profil lain (komunitas).
-- Policy UPDATE dan trigger perlindungan role (0002) tidak diubah. JALANKAN SETELAH kode baru ter-deploy.
--
-- ROLLBACK blok E:
--   DROP POLICY IF EXISTS "Authenticated read profiles" ON profiles;
--   CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO public USING (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated read profiles" ON profiles;
CREATE POLICY "Authenticated read profiles" ON profiles
  FOR SELECT TO authenticated
  USING (true);
