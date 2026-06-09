-- =====================================================
-- MIGRATION: Fix texts table - Add INSERT/UPDATE/DELETE RLS policies + difficulty_score column
-- Created: 2026-06-09
-- Purpose: Fix bug where texts can't be inserted + add difficulty scoring
-- =====================================================

-- 1. ADD INSERT/UPDATE/DELETE RLS POLICIES for texts table
-- Currently only SELECT policy exists, so inserts fail silently

DROP POLICY IF EXISTS "Users can insert texts" ON texts;
CREATE POLICY "Users can insert texts"
  ON texts FOR INSERT
  WITH CHECK (is_public = true);

DROP POLICY IF EXISTS "Users can update own texts" ON texts;
CREATE POLICY "Users can update own texts"
  ON texts FOR UPDATE
  USING (is_public = true)
  WITH CHECK (is_public = true);

DROP POLICY IF EXISTS "Users can delete texts" ON texts;
CREATE POLICY "Users can delete texts"
  ON texts FOR DELETE
  USING (is_public = true);

-- 2. ADD difficulty_score column for Difficulty Predictor
ALTER TABLE texts 
  ADD COLUMN IF NOT EXISTS difficulty_score NUMERIC(4,1);

ALTER TABLE texts 
  ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(2);

ALTER TABLE texts 
  ADD COLUMN IF NOT EXISTS word_complexity_pct INTEGER;

ALTER TABLE texts 
  ADD COLUMN IF NOT EXISTS avg_sentence_length NUMERIC(5,1);

-- 3. Backfill difficulty_score based on existing difficulty labels
UPDATE texts
SET 
  difficulty_score = CASE 
    WHEN difficulty = 'beginner' THEN 3.0
    WHEN difficulty = 'intermediate' THEN 5.5
    WHEN difficulty = 'advanced' THEN 8.0
    ELSE 5.0
  END,
  cefr_level = CASE
    WHEN difficulty = 'beginner' THEN 'A2'
    WHEN difficulty = 'intermediate' THEN 'B1'
    WHEN difficulty = 'advanced' THEN 'C1'
    ELSE 'B1'
  END
WHERE difficulty_score IS NULL;

-- 4. Add index for difficulty sorting
CREATE INDEX IF NOT EXISTS idx_texts_difficulty_score ON texts(difficulty_score);
CREATE INDEX IF NOT EXISTS idx_texts_cefr_level ON texts(cefr_level);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'texts';

-- Check new columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'texts' AND column_name IN ('difficulty_score', 'cefr_level', 'word_complexity_pct', 'avg_sentence_length');

-- =====================================================
-- END OF MIGRATION
-- =====================================================
