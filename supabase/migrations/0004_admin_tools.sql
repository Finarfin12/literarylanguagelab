-- =====================================================
-- Migration 0004: Tab admin lainnya (Fase 6)
-- Ringkasan biaya, audit log aksi admin, dan indeks untuk tab Pemakaian.
-- Bergantung pada 0001 (ai_usage_logs), 0002 (is_admin()), 0003 (ai_models).
-- =====================================================

-- system_config dipakai kode sejak v1 tapi tidak tercatat di baseline.
-- CREATE IF NOT EXISTS agar database baru juga punya tabelnya.
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harga per 1 juta token (USD) untuk estimasi biaya di tab Ringkasan
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_in NUMERIC(10, 4);
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS price_out NUMERIC(10, 4);

-- Indeks untuk filter tab Pemakaian dan agregat Ringkasan
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_feature ON ai_usage_logs (feature_key, created_at DESC);

-- Audit log: siapa mengubah apa dan kapan di tab admin.
-- Ditulis oleh server (service role); admin hanya bisa membaca.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,          -- mis. 'provider.update', 'user.ban', 'feature.toggle'
  target TEXT,                   -- id / key objek yang diubah
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log (created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit log" ON admin_audit_log;
CREATE POLICY "Admins read audit log" ON admin_audit_log
  FOR SELECT USING (public.is_admin());
