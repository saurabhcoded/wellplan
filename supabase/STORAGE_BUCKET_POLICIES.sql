-- Storage Bucket Policies for wellplan-bucket
-- Run these queries in your Supabase SQL Editor

-- First, make sure the bucket exists (if not, create it via the Dashboard)
-- The bucket should be named 'wellplan-bucket' and set as PRIVATE (not public)

-- Policy 1: Users can upload their own files
-- Files must be stored in a folder named with their user ID
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wellplan-bucket' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'wellplan-bucket' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'wellplan-bucket' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'wellplan-bucket' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wellplan-bucket' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- To verify policies are created, run:
-- SELECT * FROM storage.policies WHERE bucket_id = 'wellplan-bucket';

-- To delete all policies and start over (if needed):
-- DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

