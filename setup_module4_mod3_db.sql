-- =========================================
-- MODULE 3: CLUBS & TRANSLATION DUELS
-- =========================================

-- 1. READING CLUBS
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE club_members (
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'member'
    PRIMARY KEY (club_id, user_id)
);

CREATE TABLE club_discussions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_title TEXT,
    chapter TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic RLS for Clubs
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs are visible to everyone" ON clubs FOR SELECT USING (true);
CREATE POLICY "Users can create clubs" ON clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Members are visible to everyone" ON club_members FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Discussions are visible to everyone" ON club_discussions FOR SELECT USING (true);
CREATE POLICY "Users can post discussions" ON club_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 2. TRANSLATION DUELS
CREATE TABLE translation_duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_text TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE duel_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duel_id UUID REFERENCES translation_duels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    translated_text TEXT NOT NULL,
    ai_feedback TEXT,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (duel_id, user_id)
);

-- Basic RLS for Duels
ALTER TABLE translation_duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Duels are visible to everyone" ON translation_duels FOR SELECT USING (true);
-- Admin can create duels (we will just seed one below)
CREATE POLICY "Admins can create duels" ON translation_duels FOR INSERT WITH CHECK (true);

CREATE POLICY "Submissions are visible to everyone" ON duel_submissions FOR SELECT USING (true);
CREATE POLICY "Users can submit translations" ON duel_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their submissions" ON duel_submissions FOR UPDATE USING (auth.uid() = user_id);


-- 3. SEED INITIAL DUEL
INSERT INTO translation_duels (title, original_text, difficulty) 
VALUES (
    'Weekly Duel #1: The Melancholy of Gatsby', 
    'He had come a long way to this blue lawn, and his dream must have seemed so close that he could hardly fail to grasp it. He did not know that it was already behind him.', 
    'Hard'
);
