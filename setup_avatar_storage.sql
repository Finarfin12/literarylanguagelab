-- Create policies for Avatar bucket

-- 1. Allow public to read avatars
DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
CREATE POLICY "Avatar Public View"
ON storage.objects FOR SELECT
USING (bucket_id = 'Avatar');

-- 2. Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Avatar Authenticated Upload" ON storage.objects;
CREATE POLICY "Avatar Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'Avatar' AND
  auth.role() = 'authenticated'
);

-- 3. Allow users to update their own avatars
DROP POLICY IF EXISTS "Avatar Authenticated Update" ON storage.objects;
CREATE POLICY "Avatar Authenticated Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'Avatar' AND
  auth.role() = 'authenticated'
);
