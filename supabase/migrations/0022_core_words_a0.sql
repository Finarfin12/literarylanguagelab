-- Migration 0022: Kosakata Inti per tema (Fase 22.5).
-- Aman dijalankan ulang. Bergantung pada 0007 (core_words). Kode tetap jalan sebelum migrasi ini: tab "Per tema"
-- tersembunyi bila kolom belum ada atau belum ada kata bertema.
-- Isi kolom lewat scripts/enrich-a0.mjs dari CSV yang ditinjau pemilik (skrip hanya UPDATE, tidak pernah INSERT).
--
-- ROLLBACK: ALTER TABLE core_words DROP COLUMN IF EXISTS translation_id, DROP COLUMN IF EXISTS theme;

ALTER TABLE core_words ADD COLUMN IF NOT EXISTS translation_id TEXT;  -- arti Indonesia singkat (ditinjau pemilik)
ALTER TABLE core_words ADD COLUMN IF NOT EXISTS theme TEXT;           -- slug tema, mis. keluarga, makanan-minuman

CREATE INDEX IF NOT EXISTS core_words_theme_idx ON core_words (theme, band) WHERE theme IS NOT NULL;
