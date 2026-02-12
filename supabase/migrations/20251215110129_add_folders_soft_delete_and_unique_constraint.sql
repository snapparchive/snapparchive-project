-- ============================================
-- MIGRATION: Complete Folders Fix (CORRECTED v2)
-- Fixes duplicate names and soft delete issues
-- ============================================

-- Step 1: Add soft delete column if not exists
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Step 2: Drop existing problematic index
DROP INDEX IF EXISTS idx_folders_unique_name_per_location;

-- Step 3: Create proper unique index that handles NULL parent_id
-- For root folders (parent_id IS NULL), ensure unique names per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_name_root
ON folders(user_id, name)
WHERE parent_id IS NULL AND deleted_at IS NULL;

-- For subfolders, ensure unique names per parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_unique_name_subfolder
ON folders(user_id, parent_id, name)
WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

-- Step 4: Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at
ON folders(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Step 5: Update ALL RLS policies for folders
-- Drop all existing folder policies
DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can create own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;
DROP POLICY IF EXISTS "Users can soft delete own folders" ON folders;

-- Recreate with proper soft delete support
CREATE POLICY "Users can view own folders"
ON folders FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can create own folders"
ON folders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ✅ FIXED: Allow updating deleted_at column for soft deletes
CREATE POLICY "Users can update own folders"
ON folders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
-- Don't restrict deleted_at in WITH CHECK - allow soft deletes
WITH CHECK (auth.uid() = user_id);

-- Step 6: Add soft delete column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Step 7: Update documents policies to hide soft-deleted documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Anyone can view public documents" ON documents;
DROP POLICY IF EXISTS "Users can create own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Recreate document policies
CREATE POLICY "Users can view own documents"
ON documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Anyone can view public documents"
ON documents FOR SELECT
TO anon
USING (is_public = true AND public_link IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Users can create own documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ✅ FIXED: Allow updating deleted_at column for soft deletes
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 8: Create index for soft-deleted documents
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at
ON documents(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Step 9: Create helper function for soft deleting folders
DROP FUNCTION IF EXISTS soft_delete_folder(uuid);
CREATE OR REPLACE FUNCTION soft_delete_folder(folder_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  affected_rows integer;
BEGIN
  -- Soft delete the folder
  UPDATE folders
  SET deleted_at = now()
  WHERE id = folder_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Return result
  IF affected_rows > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Folder deleted successfully',
      'deleted_count', affected_rows
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Folder not found or already deleted',
      'deleted_count', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create helper function for soft deleting documents
DROP FUNCTION IF EXISTS soft_delete_document(uuid);
CREATE OR REPLACE FUNCTION soft_delete_document(document_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  affected_rows integer;
BEGIN
  -- Soft delete the document
  UPDATE documents
  SET deleted_at = now()
  WHERE id = document_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Return result
  IF affected_rows > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Document deleted successfully',
      'deleted_count', affected_rows
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Document not found or already deleted',
      'deleted_count', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant execute permissions
GRANT EXECUTE ON FUNCTION soft_delete_folder TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_document TO authenticated;

-- Step 12: Verify policies are correct
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'folders'
    AND policyname LIKE '%update%';
  
  IF policy_count > 1 THEN
    RAISE NOTICE 'WARNING: Multiple UPDATE policies found on folders table. This may cause conflicts.';
  ELSE
    RAISE NOTICE 'SUCCESS: Folder policies configured correctly.';
  END IF;
END $$;