-- =====================================================
-- 0000_baseline.sql
-- Baseline database schema for Literary Language Lab
-- Note: Pemilik proyek dapat memperbarui file ini dari Supabase langsung dengan perintah:
--   supabase db dump --schema public > supabase/migrations/0000_baseline.sql
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  level TEXT DEFAULT 'intermediate',
  role TEXT DEFAULT 'user',
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  vocab_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Literary Texts Library
CREATE TABLE IF NOT EXISTS texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  era TEXT,
  genre TEXT,
  difficulty TEXT DEFAULT 'intermediate',
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

-- Reading Sessions
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

-- Translations
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

-- Idioms
CREATE TABLE IF NOT EXISTS idioms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  idiom TEXT NOT NULL,
  meaning TEXT NOT NULL,
  origin TEXT,
  example_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Glossaries
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

-- Translation Memory
CREATE TABLE IF NOT EXISTS translation_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  target_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Annotation Votes
CREATE TABLE IF NOT EXISTS annotation_votes (
  annotation_id UUID REFERENCES community_annotations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (annotation_id, user_id)
);

