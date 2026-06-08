-- Users (dihandle Supabase Auth, tabel tambahan untuk profile)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  level TEXT DEFAULT 'intermediate', -- beginner/intermediate/advanced
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teks sastra yang tersedia di app
CREATE TABLE texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  era TEXT, -- Victorian, Modern, Contemporary, etc.
  genre TEXT, -- Novel, Poetry, Drama, Essay
  difficulty TEXT DEFAULT 'intermediate',
  content TEXT NOT NULL,
  word_count INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary bank per user
CREATE TABLE vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  context_sentence TEXT, -- kalimat asli dari teks
  context_source TEXT,   -- judul teks sumbernya
  register TEXT,         -- formal/literary/colloquial/archaic
  notes TEXT,            -- catatan personal user
  mastery_level INTEGER DEFAULT 0, -- 0-5 untuk spaced repetition
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Sesi baca per user
CREATE TABLE reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  last_position INTEGER DEFAULT 0, -- untuk resume reading
  words_looked_up INTEGER DEFAULT 0,
  words_saved INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation submissions
CREATE TABLE translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  original_passage TEXT NOT NULL,
  user_translation TEXT NOT NULL,
  ai_feedback TEXT,           -- feedback dari Groq
  feedback_score INTEGER,     -- 1-5, dinilai AI
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES --

-- Vocabulary: user hanya akses miliknya
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own vocabulary"
  ON vocabulary FOR ALL
  USING (auth.uid() = user_id);

-- Profiles: user hanya edit profilnya sendiri
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Reading sessions: private per user
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own sessions"
  ON reading_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Translations: private per user
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own translations"
  ON translations FOR ALL
  USING (auth.uid() = user_id);

-- Trigger untuk membuat profile otomatis saat user mendaftar di Supabase Auth
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
