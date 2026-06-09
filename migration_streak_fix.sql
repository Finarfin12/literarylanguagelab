-- =====================================================
-- MIGRATION: Fix streak system — login-based daily streak
-- =====================================================

-- 1. Add last_login_at column to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Backfill: set last_login_at to now() for existing users
UPDATE profiles SET last_login_at = NOW() WHERE last_login_at IS NULL;

-- 3. Create function to update streak on login
CREATE OR REPLACE FUNCTION public.update_login_streak(target_user_id UUID)
RETURNS void AS $$
DECLARE
  last_login TIMESTAMPTZ;
  diff INTEGER;
BEGIN
  SELECT p.last_login_at INTO last_login FROM profiles p WHERE p.id = target_user_id;
  
  IF last_login IS NULL THEN
    -- First login ever
    UPDATE profiles SET streak = 1, last_login_at = NOW() WHERE id = target_user_id;
  ELSE
    diff := EXTRACT(DAY FROM (NOW() - last_login));
    
    IF diff = 0 THEN
      -- Already logged in today — skip (don't double count)
      RETURN;
    ELSIF diff = 1 THEN
      -- Logged in yesterday — extend streak
      UPDATE profiles SET streak = streak + 1, last_login_at = NOW() WHERE id = target_user_id;
    ELSE
      -- Gap >1 day — reset streak
      UPDATE profiles SET streak = 1, last_login_at = NOW() WHERE id = target_user_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
