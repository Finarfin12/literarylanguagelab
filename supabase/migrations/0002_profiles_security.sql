-- =====================================================
-- Migration 0002: Profiles Security & Role Protection (B-13)
-- Mencegah eskalasi hak akses (privilege escalation) pengguna biasa ke 'admin'.
-- Hanya service role / proses server terpercaya yang dapat mengubah kolom 'role'.
-- =====================================================

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Periksa apakah pemanggil adalah service_role
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role'
       AND CURRENT_USER NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      RAISE EXCEPTION 'Akses ditolak: Kolom role tidak dapat diubah oleh pengguna biasa.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

