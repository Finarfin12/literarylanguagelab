-- =====================================================
-- MIGRATION: Fix Schema Mismatches
-- =====================================================
-- Version: 1.0
-- Created: 2026-06-09
-- Purpose: Fix 4 critical schema mismatches found in audit
-- Run after: supabase_setup.sql + all module migrations
-- =====================================================

-- =====================================================
-- 1. ADD VOCABULARY SM-2 FIELDS
-- =====================================================
-- Issue: vocabulary table missing SM-2 algorithm fields
-- Used in: app/(dashboard)/review/actions.ts
-- Priority: P1

ALTER TABLE vocabulary 
  ADD COLUMN IF NOT EXISTS repetition_count INTEGER DEFAULT 0;

ALTER TABLE vocabulary 
  ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 1;

ALTER TABLE vocabulary 
  ADD COLUMN IF NOT EXISTS efactor NUMERIC DEFAULT 2.5;

-- Backfill existing rows with default values
UPDATE vocabulary 
SET 
  repetition_count = 0,
  interval = 1,
  efactor = 2.5
WHERE 
  repetition_count IS NULL 
  OR interval IS NULL 
  OR efactor IS NULL;

-- =====================================================
-- 2. STANDARDIZE texts.difficulty (NO MIGRATION NEEDED)
-- =====================================================
-- Issue: Code uses both 'difficulty' and 'difficulty_level'
-- Decision: Keep 'difficulty' (already in schema)
-- Action: Fix code, not schema (see code migration below)
-- Priority: P0

-- No SQL changes needed. Field already exists as 'difficulty'.
-- Code will be updated separately.

-- =====================================================
-- 3. STANDARDIZE activity_logs.action_type (NO MIGRATION NEEDED)
-- =====================================================
-- Issue: Code inserts 'action' but schema has 'action_type'
-- Decision: Keep 'action_type' (already in schema)
-- Action: Fix code, not schema (see code migration below)
-- Priority: P0

-- No SQL changes needed. Field already exists as 'action_type'.
-- Code will be updated separately.

-- =====================================================
-- 4. REMOVE DEMO POLICIES (OR true)
-- =====================================================
-- Issue: idioms and activity_logs have bypass policies
-- Priority: P0 (security)

-- Drop existing demo policies
DROP POLICY IF EXISTS "Users can access own idioms" ON idioms;
DROP POLICY IF EXISTS "Users can access own activity logs" ON activity_logs;

-- Create production-ready policies (without OR true)
CREATE POLICY "Users can access own idioms"
  ON idioms FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access own activity logs"
  ON activity_logs FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. ADD INDEXES FOR PERFORMANCE
-- =====================================================
-- Add indexes for common query patterns

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id 
  ON vocabulary(user_id);

CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review 
  ON vocabulary(user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id 
  ON activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
  ON activity_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_texts_difficulty 
  ON texts(difficulty);

CREATE INDEX IF NOT EXISTS idx_texts_is_public 
  ON texts(is_public);

CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_text 
  ON reading_sessions(user_id, text_id);

CREATE INDEX IF NOT EXISTS idx_community_annotations_term 
  ON community_annotations(term);

-- =====================================================
-- 6. ADD CONSTRAINTS FOR DATA VALIDATION
-- =====================================================

-- Vocabulary mastery level must be 0-5
ALTER TABLE vocabulary 
  ADD CONSTRAINT IF NOT EXISTS vocabulary_mastery_level_range 
  CHECK (mastery_level >= 0 AND mastery_level <= 5);

-- Translation feedback score must be 1-5
ALTER TABLE translations 
  ADD CONSTRAINT IF NOT EXISTS translations_feedback_score_range 
  CHECK (feedback_score >= 1 AND feedback_score <= 5);

-- Profiles level enum
ALTER TABLE profiles 
  ADD CONSTRAINT IF NOT EXISTS profiles_level_enum 
  CHECK (level IN ('beginner', 'intermediate', 'advanced'));

-- Texts difficulty enum
ALTER TABLE texts 
  ADD CONSTRAINT IF NOT EXISTS texts_difficulty_enum 
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify vocabulary SM-2 fields exist
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'vocabulary'
-- AND column_name IN ('repetition_count', 'interval', 'efactor');

-- Verify indexes created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('vocabulary', 'activity_logs', 'texts', 'reading_sessions', 'community_annotations');

-- Verify constraints added
-- SELECT conname, contype, convalidated
-- FROM pg_constraint
-- WHERE conrelid IN ('vocabulary'::regclass, 'translations'::regclass, 'profiles'::regclass, 'texts'::regclass);

-- =====================================================
-- ROLLBACK PLAN (if needed)
-- =====================================================

-- To rollback SM-2 fields:
-- ALTER TABLE vocabulary DROP COLUMN IF EXISTS repetition_count;
-- ALTER TABLE vocabulary DROP COLUMN IF EXISTS interval;
-- ALTER TABLE vocabulary DROP COLUMN IF EXISTS efactor;

-- To rollback demo policies (restore OR true):
-- DROP POLICY "Users can access own idioms" ON idioms;
-- CREATE POLICY "Users can access own idioms"
--   ON idioms FOR ALL
--   USING (auth.uid() = user_id OR true);
-- (repeat for activity_logs)

-- To rollback indexes:
-- DROP INDEX IF EXISTS idx_vocabulary_user_id;
-- DROP INDEX IF EXISTS idx_vocabulary_next_review;
-- (repeat for all indexes)

-- To rollback constraints:
-- ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_mastery_level_range;
-- (repeat for all constraints)

-- =====================================================
-- END OF MIGRATION
-- =====================================================
