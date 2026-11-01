-- Hapus pesan (halaman Pesan): pengirim boleh menghapus pesannya sendiri.
-- Tabel direct_messages tidak dibuat oleh migrasi di repo (dibuat langsung di Supabase), jadi blok ini hanya
-- bertindak bila tabelnya ada dan hanya menambah kebijakan DELETE yang belum ada. RLS tidak diaktifkan/dimatikan di sini:
-- jika RLS pada tabel ini aktif, tanpa kebijakan ini penghapusan ditolak diam-diam; jika tidak aktif, penghapusan sudah boleh.
-- Idempoten. Nomor 0012–0014 dan 0016 dicadangkan untuk Fase 15–18.

DO $$
BEGIN
  IF to_regclass('public.direct_messages') IS NULL THEN
    RAISE NOTICE 'Tabel public.direct_messages tidak ada; migrasi dilewati.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'direct_messages' AND policyname = 'Pengirim dapat menghapus pesannya'
  ) THEN
    CREATE POLICY "Pengirim dapat menghapus pesannya"
      ON public.direct_messages
      FOR DELETE
      USING (auth.uid() = sender_id);
  END IF;
END $$;
