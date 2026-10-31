-- =====================================================
-- Migration 0002: Profiles Security & Role Protection (B-13)
-- Mencegah eskalasi hak akses (privilege escalation) pengguna biasa ke 'admin'.
-- Kolom 'role' hanya boleh diubah oleh admin (lewat sesi login) atau proses server
-- terpercaya (service_role, postgres, supabase_admin, trigger handle_new_user).
-- =====================================================

-- Helper: apakah pemanggil (auth.uid()) adalah admin.
-- SECURITY DEFINER agar tidak terpengaruh RLS, dengan search_path terkunci.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Trigger function berjalan sebagai SECURITY INVOKER (default), sehingga
-- CURRENT_USER adalah role pemanggil sebenarnya: 'authenticated' / 'anon' untuk
-- request dari klien, 'service_role' / 'postgres' untuk proses server.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF CURRENT_USER NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.role, 'user') <> 'user' AND NOT public.is_admin() THEN
      NEW.role := 'user';
    END IF;
  ELSIF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Kolom role tidak dapat diubah oleh pengguna biasa.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();
