-- 1. Pembersihan Kategori Ganda
DELETE FROM forum_categories a USING forum_categories b
WHERE a.name = b.name AND a.created_at > b.created_at;

-- 2. Pembuatan Bucket Penyimpanan Gambar & Izin (RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum_images', 'forum_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Forum Images Public View" ON storage.objects;
CREATE POLICY "Forum Images Public View"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum_images');

DROP POLICY IF EXISTS "Forum Images Authenticated Upload" ON storage.objects;
CREATE POLICY "Forum Images Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum_images' AND
  auth.role() = 'authenticated'
);

-- 3. Penambahan Kolom Peran (Role) di Profil User
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 4. Pembaruan Kebijakan (RLS) Forum agar Admin Bisa Melakukan Segalanya
-- Menghapus kebijakan lama
DROP POLICY IF EXISTS "Users can update their own threads" ON forum_threads;
DROP POLICY IF EXISTS "Users can delete their own threads" ON forum_threads;
DROP POLICY IF EXISTS "Users can delete their own comments" ON forum_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON forum_comments;

-- Membuat kebijakan baru untuk Thread
CREATE POLICY "Users and admins can update threads" ON forum_threads
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users and admins can delete threads" ON forum_threads
FOR DELETE USING (
  auth.uid() = user_id OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Membuat kebijakan baru untuk Komentar
CREATE POLICY "Users and admins can update comments" ON forum_comments
FOR UPDATE USING (
  auth.uid() = user_id OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users and admins can delete comments" ON forum_comments
FOR DELETE USING (
  auth.uid() = user_id OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
