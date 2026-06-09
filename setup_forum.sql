-- Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO forum_categories (name, description, icon) VALUES 
('Diskusi Sastra', 'Tempat berdiskusi tentang karya sastra klasik maupun modern.', 'book'),
('Kritik & Esai', 'Bagikan opini, analisis, atau esai Anda tentang tren kepenulisan.', 'pen-tool'),
('Ruang Santai', 'Obrolan santai seputar dunia tulis-menulis dan sastra.', 'coffee'),
('Tanya Jawab', 'Punya pertanyaan seputar grammar, kosakata, atau gaya bahasa? Tanyakan di sini!', 'help-circle'),
('Hobi & Pembahasan Bebas', 'Tempat ngobrol bebas di luar topik sastra. Punya hobi lain? Bagikan di sini!', 'gamepad-2');

-- Create forum_threads table
CREATE TABLE IF NOT EXISTS forum_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES forum_categories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

-- Policies for forum_categories
CREATE POLICY "Anyone can view categories" ON forum_categories FOR SELECT USING (true);

-- Policies for forum_threads
CREATE POLICY "Anyone can view threads" ON forum_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert threads" ON forum_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own threads" ON forum_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own threads" ON forum_threads FOR DELETE USING (auth.uid() = user_id);

-- Policies for forum_comments
CREATE POLICY "Anyone can view comments" ON forum_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON forum_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON forum_comments FOR UPDATE USING (auth.uid() = user_id);
