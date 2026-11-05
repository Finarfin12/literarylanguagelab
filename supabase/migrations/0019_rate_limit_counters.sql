-- Migration 0019: penghitung batas pemakaian lintas instance (Fase 19.3)
-- Aman dijalankan ulang. Tanpa migrasi ini kode memakai perilaku lama (memori per instance + count_recent_usage).
--
-- Cara kerja: consume_rate_limit(key, jendela_detik, batas) menambah hitungan jendela saat ini secara atomik
-- dan mengembalikan hitungan terbaru. Pemanggil menolak bila hitungan > batas.
-- Tabel tidak punya policy: klien tidak bisa membaca/menulis langsung, hanya lewat fungsi.
--
-- ROLLBACK (bila perlu):
--   DROP FUNCTION IF EXISTS consume_rate_limit(text, integer, integer);
--   DROP TABLE IF EXISTS rate_limit_counters;

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key            TEXT        NOT NULL,
  window_seconds INTEGER     NOT NULL,
  window_start   TIMESTAMPTZ NOT NULL,
  count          INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, key, window_seconds, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_window ON rate_limit_counters (window_start);

ALTER TABLE rate_limit_counters ENABLE ROW LEVEL SECURITY;
-- Sengaja tanpa policy: hanya fungsi SECURITY DEFINER di bawah yang boleh menyentuh tabel ini.

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key            TEXT,
  p_window_seconds INTEGER,
  p_limit          INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Harus login.' USING ERRCODE = '28000';
  END IF;
  IF p_key IS NULL OR length(p_key) = 0 OR length(p_key) > 80
     OR p_window_seconds IS NULL OR p_window_seconds < 1 OR p_window_seconds > 86400
     OR p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'Parameter batas pemakaian tidak valid.' USING ERRCODE = '22023';
  END IF;

  v_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  -- Hitungan berhenti naik setelah melewati batas supaya tabel tidak membengkak oleh permintaan yang ditolak.
  INSERT INTO rate_limit_counters AS c (user_id, key, window_seconds, window_start, count)
  VALUES (v_uid, p_key, p_window_seconds, v_start, 1)
  ON CONFLICT (user_id, key, window_seconds, window_start)
  DO UPDATE SET count = c.count + (CASE WHEN c.count <= p_limit THEN 1 ELSE 0 END)
  RETURNING c.count INTO v_count;

  -- Pembersihan oportunistik (sekitar 1% panggilan): buang jendela yang sudah lewat lebih dari 2 hari.
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_counters WHERE window_start < now() - INTERVAL '2 days';
  END IF;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION consume_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;
