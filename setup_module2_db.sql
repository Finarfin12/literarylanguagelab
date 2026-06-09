-- Setup Translation Memory and Glossaries Tables

-- 1. Create translation_memory table
CREATE TABLE translation_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_phrase TEXT NOT NULL,
    translated_phrase TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own translation memory"
    ON translation_memory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own translation memory"
    ON translation_memory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own translation memory"
    ON translation_memory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own translation memory"
    ON translation_memory FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Create glossaries table
CREATE TABLE glossaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    book_title TEXT, -- optional, if specific to a book
    author TEXT, -- optional, if specific to an author
    term TEXT NOT NULL,
    preferred_translation TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE glossaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own glossaries"
    ON glossaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own glossaries"
    ON glossaries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glossaries"
    ON glossaries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glossaries"
    ON glossaries FOR DELETE
    USING (auth.uid() = user_id);
