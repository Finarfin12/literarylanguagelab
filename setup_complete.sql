-- =====================================================
-- LITERARY LANGUAGE LAB — COMPLETE SETUP
-- Copy-paste seluruh file ini ke Supabase SQL Editor → Run
-- =====================================================

-- 1. ENABLE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE ALL MISSING TABLES (pakai IF NOT EXISTS, aman)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  level TEXT DEFAULT 'intermediate',
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  vocab_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  context_sentence TEXT,
  context_source TEXT,
  register TEXT,
  notes TEXT,
  mastery_level INTEGER DEFAULT 0,
  repetition_count INTEGER DEFAULT 0,
  interval INTEGER DEFAULT 1,
  efactor NUMERIC DEFAULT 2.5,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  last_position INTEGER DEFAULT 0,
  words_looked_up INTEGER DEFAULT 0,
  words_saved INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  original_passage TEXT NOT NULL,
  user_translation TEXT NOT NULL,
  ai_feedback TEXT,
  feedback_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idioms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  idiom TEXT NOT NULL,
  meaning TEXT NOT NULL,
  origin TEXT,
  example_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS glossaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  preferred_translation TEXT NOT NULL,
  book_title TEXT,
  author TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translation_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  explanation TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS annotation_votes (
  annotation_id UUID REFERENCES community_annotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (annotation_id, user_id)
);

-- 3. ROW LEVEL SECURITY (ALL POLICIES)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view public texts" ON texts;
CREATE POLICY "Everyone can view public texts" ON texts FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users can insert texts" ON texts;
CREATE POLICY "Users can insert texts" ON texts FOR INSERT WITH CHECK (is_public = true);

ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access own vocabulary" ON vocabulary;
CREATE POLICY "Users can only access own vocabulary" ON vocabulary FOR ALL USING (auth.uid() = user_id);

ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access own sessions" ON reading_sessions;
CREATE POLICY "Users can only access own sessions" ON reading_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only access own translations" ON translations;
CREATE POLICY "Users can only access own translations" ON translations FOR ALL USING (auth.uid() = user_id);

ALTER TABLE idioms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own idioms" ON idioms;
CREATE POLICY "Users can access own idioms" ON idioms FOR ALL USING (auth.uid() = user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own activity logs" ON activity_logs;
CREATE POLICY "Users can access own activity logs" ON activity_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE glossaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own glossaries" ON glossaries;
CREATE POLICY "Users can access own glossaries" ON glossaries FOR ALL USING (auth.uid() = user_id);

ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access own translation memory" ON translation_memory;
CREATE POLICY "Users can access own translation memory" ON translation_memory FOR ALL USING (auth.uid() = user_id);

ALTER TABLE community_annotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view community annotations" ON community_annotations;
CREATE POLICY "Everyone can view community annotations" ON community_annotations FOR SELECT USING (true);

ALTER TABLE annotation_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view votes" ON annotation_votes;
CREATE POLICY "Everyone can view votes" ON annotation_votes FOR SELECT USING (true);

-- 4. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, xp, streak, vocab_count)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', split_part(new.email, '@', 1), 0, 0, 0)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. ADD difficulty_score COLUMNS TO texts
ALTER TABLE texts ADD COLUMN IF NOT EXISTS difficulty_score NUMERIC(4,1);
ALTER TABLE texts ADD COLUMN IF NOT EXISTS cefr_level VARCHAR(2);
ALTER TABLE texts ADD COLUMN IF NOT EXISTS word_complexity_pct INTEGER;
ALTER TABLE texts ADD COLUMN IF NOT EXISTS avg_sentence_length NUMERIC(5,1);

-- 6. BACKFILL difficulty_score
UPDATE texts SET 
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

-- 7. BACKFILL profiles for existing users (supaya yang udah register punya profile)
INSERT INTO public.profiles (id, username, xp, streak, vocab_count)
SELECT id, split_part(email, '@', 1), 0, 0, 0
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFIKASI: jalankan query ini setelah run
-- =====================================================
-- SELECT count(*) FROM texts WHERE is_public = true;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
