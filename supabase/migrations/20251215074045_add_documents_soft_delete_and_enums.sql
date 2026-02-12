-- ============================================
-- MIGRATION: Complete Documents Soft Delete Fix
-- Fixes RLS policy issues preventing soft deletes
-- ============================================

-- Step 1: Add soft delete column if not exists
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Step 2: Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at
ON documents(deleted_at)
WHERE deleted_at IS NOT NULL;

-- Step 3: Drop existing document policies
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Anyone can view public documents" ON documents;
DROP POLICY IF EXISTS "Users can create own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Step 4: Recreate document policies with proper soft delete support
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

-- ✅ FIX: Remove deleted_at restriction in WITH CHECK
-- This allows updates that set deleted_at
CREATE POLICY "Users can update own documents"
ON documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);  -- Only check user_id, not deleted_at

-- Keep hard delete policy for admin operations
CREATE POLICY "Users can delete own documents"
ON documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Create improved soft delete function
CREATE OR REPLACE FUNCTION soft_delete_document(document_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  affected_rows integer;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Not authenticated',
      'deleted_count', 0
    );
  END IF;

  -- Soft delete the document
  UPDATE documents
  SET deleted_at = now()
  WHERE id = document_id
    AND user_id = current_user_id
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

-- Step 6: Create batch soft delete function
CREATE OR REPLACE FUNCTION soft_delete_documents(document_ids uuid[])
RETURNS json AS $$
DECLARE
  result json;
  affected_rows integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Not authenticated',
      'deleted_count', 0
    );
  END IF;

  UPDATE documents
  SET deleted_at = now()
  WHERE id = ANY(document_ids)
    AND user_id = current_user_id
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  result := json_build_object(
    'success', true,
    'message', format('%s document(s) deleted successfully', affected_rows),
    'deleted_count', affected_rows
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create restore function for undeleting documents
CREATE OR REPLACE FUNCTION restore_document(document_id uuid)
RETURNS json AS $$
DECLARE
  result json;
  affected_rows integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Not authenticated',
      'restored_count', 0
    );
  END IF;

  UPDATE documents
  SET deleted_at = NULL
  WHERE id = document_id
    AND user_id = current_user_id
    AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows > 0 THEN
    result := json_build_object(
      'success', true,
      'message', 'Document restored successfully',
      'restored_count', affected_rows
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Document not found or not deleted',
      'restored_count', 0
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Grant execute permissions
GRANT EXECUTE ON FUNCTION soft_delete_document TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_documents TO authenticated;
GRANT EXECUTE ON FUNCTION restore_document TO authenticated;

-- Step 9: Verify the fix worked
DO $$
DECLARE
  policy_count integer;
  check_clause text;
BEGIN
  -- Check UPDATE policy
  SELECT COUNT(*), MAX(with_check)
  INTO policy_count, check_clause
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'documents'
    AND policyname = 'Users can update own documents';
  
  IF policy_count = 0 THEN
    RAISE WARNING 'UPDATE policy not found!';
  ELSIF check_clause LIKE '%deleted_at%' THEN
    RAISE WARNING 'UPDATE policy still has deleted_at in WITH CHECK - this will block soft deletes!';
  ELSE
    RAISE NOTICE 'SUCCESS: Document policies configured correctly for soft deletes.';
  END IF;
END $$;