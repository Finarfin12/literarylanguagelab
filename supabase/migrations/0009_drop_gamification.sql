-- =====================================================
-- Migration 0009: Pembersihan skema gamifikasi (Fase 7)
--
-- ⚠️ JANGAN DIJALANKAN SEKARANG.
-- Jalankan hanya setelah v2 stabil minimal 2 minggu, dan SETELAH BACKUP database
-- (Supabase Dashboard → Database → Backups, atau `supabase db dump`).
-- Perubahan ini tidak bisa dibatalkan tanpa backup.
--
-- Kode v2 sudah tidak membaca/menulis objek di bawah ini (Fase 1 & Q2).
-- Yang SENGAJA dipertahankan:
--   - writing_submissions : masih dipakai Latihan Menulis setelah membaca (api/writing-challenge/evaluate)
--   - user_badges         : masih ditampilkan di halaman profil
--   - activity_logs       : dipakai dashboard & riwayat
-- =====================================================

BEGIN;

-- Kolom gamifikasi di profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS xp;
ALTER TABLE profiles DROP COLUMN IF EXISTS streak;
ALTER TABLE profiles DROP COLUMN IF EXISTS longest_streak;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_login_date;
ALTER TABLE profiles DROP COLUMN IF EXISTS journey_level;

-- Reading Journey
DROP TABLE IF EXISTS journey_progress;

-- Translation Duels
DROP TABLE IF EXISTS duel_votes;
DROP TABLE IF EXISTS duel_submissions;
DROP TABLE IF EXISTS duels;

-- Latihan Harian (dihapus di Q2)
DROP TABLE IF EXISTS daily_activities;

-- Weekly Translation Challenge (dihapus di Q2)
DROP TABLE IF EXISTS challenge_submissions;
DROP TABLE IF EXISTS weekly_challenges;
DROP TABLE IF EXISTS challenges;

-- RPC streak login (B-09)
DROP FUNCTION IF EXISTS update_login_streak(UUID);

COMMIT;
