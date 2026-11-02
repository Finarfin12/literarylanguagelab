-- Hapus pesan & hapus percakapan (halaman Pesan): pengirim boleh menghapus pesannya; pengirim ATAU penerima boleh
-- menghapus pesan dalam percakapan mereka (dipakai tombol "Hapus percakapan", yang menghapus kedua arah untuk kedua pihak).
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
    WHERE schemaname = 'public' AND tablename = 'direct_messages' AND policyname = 'Peserta percakapan dapat menghapus pesan'
  ) THEN
    CREATE POLICY "Peserta percakapan dapat menghapus pesan"
      ON public.direct_messages
      FOR DELETE
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END $$;
