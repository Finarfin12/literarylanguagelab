-- Setup Layer 4 Gamification Columns in profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vocab_count INTEGER DEFAULT 0;

-- Generate initial usernames from email for existing users by joining auth.users
UPDATE public.profiles 
SET username = split_part(auth.users.email, '@', 1) 
FROM auth.users 
WHERE public.profiles.id = auth.users.id AND public.profiles.username IS NULL;

-- Update the new user trigger to also handle username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, xp, streak, vocab_count)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    split_part(new.email, '@', 1), -- generate initial username
    0, 0, 0
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
