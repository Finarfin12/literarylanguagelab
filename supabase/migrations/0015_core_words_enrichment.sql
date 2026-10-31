-- Fase 14g (v4): pengayaan Kosakata Inti dengan data NGSL tambahan.
-- Hanya bergantung pada 0007 (tabel core_words). Tidak mengubah band/cefr_estimate/pos/example.
-- Diisi oleh scripts/enrich-ngsl.mjs (definisi bahasa Inggris sederhana dan bentuk kata dari NGSL 1.2,
-- CC BY-SA 4.0). Kode tetap jalan sebelum migrasi ini dijalankan.
-- RLS tidak berubah: kebijakan 0007 (baca semua pengguna login, tulis admin) berlaku untuk kolom baru.

ALTER TABLE core_words ADD COLUMN IF NOT EXISTS definition_en TEXT;
ALTER TABLE core_words ADD COLUMN IF NOT EXISTS forms TEXT[] NOT NULL DEFAULT '{}';

-- Pencarian "kata ini bentuk dari kata inti mana" (forms @> ARRAY['searched'])
CREATE INDEX IF NOT EXISTS idx_core_words_forms ON core_words USING GIN (forms);
