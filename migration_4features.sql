-- =====================================================
-- MIGRATION: 4 Feature Updates
-- Annotations, Challenges, Translation Revisions, Parallel Texts
-- =====================================================

-- 1. ANNOTATION SYSTEM
CREATE TABLE IF NOT EXISTS annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  gutenberg_id TEXT,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  highlighted_text TEXT NOT NULL,
  note TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own annotations" ON annotations;
CREATE POLICY "Users can access own annotations" ON annotations FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Everyone can view public annotations" ON annotations;
CREATE POLICY "Everyone can view public annotations" ON annotations FOR SELECT USING (is_public = true);
CREATE INDEX IF NOT EXISTS idx_annotations_user_text ON annotations(user_id, text_id);

-- 2. WEEKLY TRANSLATION CHALLENGES
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  original_text TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  translation TEXT NOT NULL,
  ai_score INTEGER,
  ai_feedback TEXT,
  user_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view challenges" ON challenges;
CREATE POLICY "Everyone can view challenges" ON challenges FOR SELECT USING (true);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view submissions" ON challenge_submissions;
CREATE POLICY "Everyone can view submissions" ON challenge_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own submissions" ON challenge_submissions;
CREATE POLICY "Users can insert own submissions" ON challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. TRANSLATION TIMELAPSE (REVISION TRACKING)
ALTER TABLE translations ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS translation_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  translation_id UUID REFERENCES translations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  changes_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE translation_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own revisions" ON translation_revisions;
CREATE POLICY "Users can access own revisions" ON translation_revisions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_revisions_translation ON translation_revisions(translation_id, version);

-- 4. PARALLEL TEXTS
CREATE TABLE IF NOT EXISTS parallel_texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID REFERENCES texts(id),
  translation_id UUID REFERENCES translations(id),
  original_sentences TEXT[],
  translated_sentences TEXT[],
  alignment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parallel_texts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view parallel texts" ON parallel_texts;
CREATE POLICY "Everyone can view parallel texts" ON parallel_texts FOR SELECT USING (true);
