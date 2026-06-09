-- Modifikasi tabel vocabulary untuk Spaced Repetition (Algoritma SM-2)

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS repetition_count INTEGER DEFAULT 0;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 0;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS efactor REAL DEFAULT 2.5;

-- Menambahkan kolom era dan genre pada tabel texts
ALTER TABLE texts ADD COLUMN IF NOT EXISTS era TEXT;
ALTER TABLE texts ADD COLUMN IF NOT EXISTS genre TEXT;
