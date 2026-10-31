-- Migration 0001: AI Usage Logs & Rate Limiting Helper
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT,
  provider_id UUID,
  model_id TEXT,
  tokens_in INT,
  tokens_out INT,
  latency_ms INT,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created ON ai_usage_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view usage logs
DROP POLICY IF EXISTS "Admins can view all usage logs" ON ai_usage_logs;
CREATE POLICY "Admins can view all usage logs"
  ON ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert own usage logs
DROP POLICY IF EXISTS "Users can insert own usage logs" ON ai_usage_logs;
CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper function to count recent usage in an interval (e.g. '1 minute', '24 hours')
CREATE OR REPLACE FUNCTION count_recent_usage(
  target_user_id UUID,
  interval_text TEXT
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  -- Pengguna hanya boleh menghitung pemakaiannya sendiri; admin boleh semua.
  IF target_user_id IS DISTINCT FROM auth.uid()
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak: tidak dapat membaca pemakaian pengguna lain.';
  END IF;

  SELECT COUNT(*)::INTEGER INTO usage_count
  FROM ai_usage_logs
  WHERE user_id = target_user_id
    AND created_at >= (NOW() - interval_text::INTERVAL);
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

