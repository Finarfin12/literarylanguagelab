-- Fase 14f (v4): hapus akun yang benar-benar berfungsi.
-- Di 0000_baseline, FK profiles.id -> auth.users(id) dibuat TANPA ON DELETE CASCADE, sehingga
-- auth.admin.deleteUser (dipakai /api/auth/delete-account dan hapus pengguna di Admin) gagal
-- selama baris profiles masih ada. Migrasi ini membuat ulang FK itu dengan ON DELETE CASCADE.
-- Tabel lain yang menunjuk ke profiles(id) / auth.users(id) sudah memakai ON DELETE CASCADE
-- (atau SET NULL untuk admin_audit_log). Aman dijalankan berulang (idempoten).
-- Kode tetap jalan sebelum migrasi ini dijalankan; hanya hapus akun yang akan gagal dengan pesan galat dari Supabase.

DO $$
DECLARE
  fk RECORD;
BEGIN
  -- Cari semua FK pada profiles(id) yang menunjuk ke auth.users (nama constraint bisa berbeda per proyek)
  FOR fk IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.profiles'::regclass
      AND c.contype = 'f'
      AND c.confrelid = 'auth.users'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk.conname);
  END LOOP;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
END $$;
