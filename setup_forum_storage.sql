-- 1. Create a public storage bucket for forum images
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum_images', 'forum_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create RLS Policies for the bucket
-- Allow public to view/download the images
CREATE POLICY "Forum Images Public View"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum_images');

-- Allow authenticated users to upload images
CREATE POLICY "Forum Images Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum_images' AND
  auth.role() = 'authenticated'
);

-- 3. Cleanup duplicate categories (just in case they were inserted multiple times)
DELETE FROM forum_categories a USING forum_categories b
WHERE a.name = b.name AND a.created_at > b.created_at;
