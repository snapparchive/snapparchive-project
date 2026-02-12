-- ============================================
-- STORAGE BUCKET SETUP WITH FOLDER STRUCTURE 
-- ============================================

-- Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  15728640, -- 15MB limit (in bytes)
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view public documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- ============================================
-- STORAGE POLICIES WITH FOLDER STRUCTURE
-- Folder structure: user_id/timestamp.extension
-- ============================================

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Public can view all documents (needed for public links)
CREATE POLICY "Public can view public documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy 4: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Users can update their own documents metadata
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- ADD THUMBNAIL SUPPORT TO DOCUMENTS TABLE
-- ============================================

-- Add thumbnail_url column if not exists
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Add index for faster thumbnail lookups
CREATE INDEX IF NOT EXISTS idx_documents_thumbnail_url 
ON documents(thumbnail_url) 
WHERE thumbnail_url IS NOT NULL;

-- ============================================
-- HELPER FUNCTION: Get Storage Path
-- Returns the correct storage path for a user's document
-- ============================================
CREATE OR REPLACE FUNCTION get_storage_path(user_id uuid, file_extension text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  timestamp bigint;
  storage_path text;
BEGIN
  timestamp := EXTRACT(EPOCH FROM now())::bigint * 1000; -- milliseconds
  storage_path := user_id::text || '/' || timestamp || '.' || file_extension;
  RETURN storage_path;
END;
$$;

-- ============================================
-- HELPER FUNCTION: Validate File Upload
-- Checks file size and type before upload
-- ============================================
CREATE OR REPLACE FUNCTION validate_file_upload(
  file_size bigint,
  file_type text
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  max_size bigint := 15728640; -- 15MB
  allowed_types text[] := ARRAY[
    'application/pdf',
    'image/png', 
    'image/jpeg',
    'image/jpg'
  ];
BEGIN
  -- Check file size
  IF file_size > max_size THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('File size %s MB exceeds maximum allowed size of 15MB', 
                     ROUND(file_size::numeric / 1024 / 1024, 2))
    );
  END IF;

  -- Check file size is not zero
  IF file_size = 0 THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'File appears to be empty or corrupted'
    );
  END IF;

  -- Check file type
  IF NOT (file_type = ANY(allowed_types)) THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('File type %s is not supported. Allowed: PDF, PNG, JPEG', file_type)
    );
  END IF;

  RETURN json_build_object('valid', true);
END;
$$;

-- ============================================
-- STORAGE USAGE TRACKING
-- Track storage usage per user
-- ============================================
CREATE TABLE IF NOT EXISTS user_storage_usage (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_files bigint DEFAULT 0,
  total_bytes bigint DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE user_storage_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own storage usage"
ON user_storage_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_user_storage_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_storage_usage (user_id, total_files, total_bytes)
    VALUES (NEW.user_id, 1, NEW.file_size)
    ON CONFLICT (user_id) DO UPDATE SET
      total_files = user_storage_usage.total_files + 1,
      total_bytes = user_storage_usage.total_bytes + NEW.file_size,
      last_updated = now();
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_storage_usage
    SET 
      total_files = GREATEST(0, total_files - 1),
      total_bytes = GREATEST(0, total_bytes - OLD.file_size),
      last_updated = now()
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to automatically update storage usage
DROP TRIGGER IF EXISTS track_storage_usage ON documents;
CREATE TRIGGER track_storage_usage
AFTER INSERT OR DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_user_storage_usage();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION get_storage_path(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_file_upload(bigint, text) TO authenticated;
GRANT SELECT ON user_storage_usage TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  'Storage Configuration' as info,
  b.id as bucket_id,
  b.name as bucket_name,
  b.public,
  b.file_size_limit / 1024 / 1024 as max_size_mb,
  b.allowed_mime_types
FROM storage.buckets b
WHERE b.id = 'documents';

SELECT 
  'Storage Policies' as info,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;