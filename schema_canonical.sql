-- =====================================================
-- LITERARY LANGUAGE LAB — CANONICAL SCHEMA
-- =====================================================
-- Version: 1.0
-- Created: 2026-06-09
-- Purpose: Single source of truth untuk database schema
-- Status: Consolidated dari 4 gelombang migration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  level TEXT DEFAULT 'intermediate', -- beginner/intermediate/advanced
  
  -- Gamification fields (added Wave 4)
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  vocab_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Literary Texts Library
CREATE TABLE IF NOT EXISTS texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  era TEXT, -- Victorian, Modern, Contemporary, etc.
  genre TEXT, -- Novel, Poetry, Drama, Essay
  difficulty TEXT DEFAULT 'intermediate', -- beginner/intermediate/advanced
  content TEXT NOT NULL,
  word_count INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Vocabulary Bank
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  context_sentence TEXT, -- kalimat asli dari teks
  context_source TEXT,   -- judul teks sumbernya
  register TEXT,         -- formal/literary/colloquial/archaic
  notes TEXT,            -- catatan personal user
  
  -- Spaced Repetition (SM-2 Algorithm) fields
  mastery_level INTEGER DEFAULT 0, -- 0-5
  repetition_count INTEGER DEFAULT 0,
  interval INTEGER DEFAULT 1,
  efactor NUMERIC DEFAULT 2.5,
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Reading Sessions (track progress per user per text)
CREATE TABLE IF NOT EXISTS reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  last_position INTEGER DEFAULT 0, -- untuk resume reading
  words_looked_up INTEGER DEFAULT 0,
  words_saved INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation Submissions & AI Feedback
CREATE TABLE IF NOT EXISTS translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  original_passage TEXT NOT NULL,
  user_translation TEXT NOT NULL,
  ai_feedback TEXT,           -- feedback dari AI
  feedback_score INTEGER,     -- 1-5, dinilai AI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's Idiom Library
CREATE TABLE IF NOT EXISTS idioms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  idiom TEXT NOT NULL,
  meaning TEXT NOT NULL,
  origin TEXT,
  example_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs (untuk tracking & analytics)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'tool_used', 'vocab_saved', 'review_completed', etc.
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSLATION TOOLS (Wave 3)
-- =====================================================

-- User's Personal Glossary
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

-- Translation Memory (reusable translation pairs)
CREATE TABLE IF NOT EXISTS translation_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNITY FEATURES (Wave 4b)
-- =====================================================

-- Community Shared Annotations
CREATE TABLE IF NOT EXISTS community_annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  explanation TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotation Votes (prevent duplicate votes)
CREATE TABLE IF NOT EXISTS annotation_votes (
  annotation_id UUID REFERENCES community_annotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (annotation_id, user_id)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Texts (public library)
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view public texts"
  ON texts FOR SELECT
  USING (is_public = true);

-- Vocabulary (private per user)
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own vocabulary"
  ON vocabulary FOR ALL
  USING (auth.uid() = user_id);

-- Reading Sessions (private per user)
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own sessions"
  ON reading_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Translations (private per user)
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own translations"
  ON translations FOR ALL
  USING (auth.uid() = user_id);

-- Idioms (private per user)
ALTER TABLE idioms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own idioms"
  ON idioms FOR ALL
  USING (auth.uid() = user_id);

-- Activity Logs (private per user)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own activity logs"
  ON activity_logs FOR ALL
  USING (auth.uid() = user_id);

-- Glossaries (private per user)
ALTER TABLE glossaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own glossaries"
  ON glossaries FOR ALL
  USING (auth.uid() = user_id);

-- Translation Memory (private per user)
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own translation memory"
  ON translation_memory FOR ALL
  USING (auth.uid() = user_id);

-- Community Annotations
ALTER TABLE community_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view community annotations"
  ON community_annotations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert annotations"
  ON community_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
  ON community_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON community_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- Annotation Votes
ALTER TABLE annotation_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own votes"
  ON annotation_votes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view votes"
  ON annotation_votes FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, xp, streak, vocab_count)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    split_part(new.email, '@', 1), -- generate initial username from email
    0, 0, 0
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- INDEXES (Performance Optimization)
-- =====================================================

-- Vocabulary lookups
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON vocabulary(user_id, next_review_at);

-- Activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Texts search
CREATE INDEX IF NOT EXISTS idx_texts_difficulty ON texts(difficulty);
CREATE INDEX IF NOT EXISTS idx_texts_is_public ON texts(is_public);

-- Reading sessions
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_text ON reading_sessions(user_id, text_id);

-- Community annotations
CREATE INDEX IF NOT EXISTS idx_community_annotations_term ON community_annotations(term);

-- =====================================================
-- CONSTRAINTS & VALIDATIONS
-- =====================================================

-- Vocabulary mastery level range
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_mastery_level_range 
  CHECK (mastery_level >= 0 AND mastery_level <= 5);

-- Translation feedback score range
ALTER TABLE translations ADD CONSTRAINT translations_feedback_score_range 
  CHECK (feedback_score >= 1 AND feedback_score <= 5);

-- Profiles level enum
ALTER TABLE profiles ADD CONSTRAINT profiles_level_enum 
  CHECK (level IN ('beginner', 'intermediate', 'advanced'));

-- Texts difficulty enum
ALTER TABLE texts ADD CONSTRAINT texts_difficulty_enum 
  CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

-- =====================================================
-- NOTES
-- =====================================================

-- 1. This schema consolidates 4 migration waves:
--    - Wave 1: MVP core (profiles, texts, vocabulary, sessions, translations)
--    - Wave 2: Library & logs (idioms, activity_logs)
--    - Wave 3: Translation tools (glossaries, translation_memory)
--    - Wave 4a: Gamification (profiles: xp, streak, vocab_count)
--    - Wave 4b: Community (community_annotations, annotation_votes)

-- 2. Field naming standardized:
--    - texts.difficulty (not difficulty_level)
--    - activity_logs.action_type (not action)

-- 3. Vocabulary SM-2 fields added:
--    - repetition_count, interval, efactor

-- 4. All demo policies (OR true) removed for security

-- 5. Indexes added for common query patterns

-- 6. Constraints added for data validation

-- =====================================================
-- END OF SCHEMA
-- =====================================================
