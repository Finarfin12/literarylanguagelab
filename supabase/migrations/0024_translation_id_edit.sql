-- Migration 0024: Penyuntingan bahasa Indonesia hasil terjemahan (Fase 29, item 3).
-- Aman dijalankan ulang. Bergantung pada 0003 (ai_feature_routes) dan 0010 (fitur terjemahan).
-- Kode tetap jalan sebelum migrasi ini: tanpa baris rute, runAI memakai konfigurasi lama (system_config + GROQ_API_KEY).
-- Migrasi ini hanya mendaftarkan feature key baru agar muncul di Admin -> Routing Fitur dengan model fitur 'translation'.
--
-- ROLLBACK:
--   DELETE FROM ai_feature_routes WHERE feature_key = 'translation-id-edit';

-- Feature key AI baru (harus sama dengan lib/ai/features.ts); memakai model 'translation' bila ada.
INSERT INTO ai_feature_routes (feature_key, model_id)
SELECT 'translation-id-edit', r.model_id
FROM ai_feature_routes r
WHERE r.feature_key = 'translation'
ON CONFLICT (feature_key) DO NOTHING;
