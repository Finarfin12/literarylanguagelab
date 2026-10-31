-- =====================================================
-- Migration 0005: Posisi baca & Lanjutkan Membaca (Fase 7, F-02)
-- reading_sessions sekarang menyimpan posisi blok dan persentase progres,
-- dan bisa mencatat buku Gutenberg (yang tidak punya baris di tabel texts).
-- =====================================================

ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS last_paragraph_index INTEGER DEFAULT 0;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS progress_pct REAL DEFAULT 0;

-- Sumber di luar tabel texts, mis. 'gutenberg_1342'. text_id dibiarkan NULL untuk baris ini.
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS source_key TEXT;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS source_title TEXT;
ALTER TABLE reading_sessions ADD COLUMN IF NOT EXISTS source_author TEXT;

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_active ON reading_sessions (user_id, last_active_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_sessions_user_source ON reading_sessions (user_id, source_key) WHERE source_key IS NOT NULL;

-- Konteks kosa kata (F-03): lokasi kata di teks sumber untuk tautan "Lihat di teks"
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS text_id TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS position_offset INTEGER;
