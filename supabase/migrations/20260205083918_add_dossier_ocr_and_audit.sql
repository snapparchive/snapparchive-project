 
-- 1. OCR OPT-IN FEATURE  

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS ocr_enabled BOOLEAN DEFAULT FALSE;

-- Set existing documents to have OCR disabled by default
UPDATE documents 
SET ocr_enabled = FALSE 
WHERE ocr_enabled IS NULL;

-- Index for OCR queue - only process enabled documents
CREATE INDEX IF NOT EXISTS idx_documents_ocr_enabled 
ON documents(ocr_enabled, ocr_status, ocr_priority, created_at) 
WHERE deleted_at IS NULL AND ocr_enabled = TRUE;

-- Update OCR queue view to respect opt-in
-- Your OCR worker should filter:
-- WHERE ocr_enabled = TRUE AND ocr_status = 'queued'

-- ============================================================
-- 2. ARCHIVE READ-ONLY ENFORCEMENT (Missing Logic)
-- ============================================================
-- Archived dossiers should be read-only
-- Add check constraint and function

CREATE OR REPLACE FUNCTION check_dossier_not_archived()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM dossiers 
    WHERE id = NEW.dossier_id 
    AND status = 'archived'
  ) THEN
    RAISE EXCEPTION 'Cannot modify archived dossier';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to dossier_documents
DROP TRIGGER IF EXISTS prevent_archived_dossier_document_changes ON dossier_documents;
CREATE TRIGGER prevent_archived_dossier_document_changes
  BEFORE INSERT OR UPDATE ON dossier_documents
  FOR EACH ROW
  EXECUTE FUNCTION check_dossier_not_archived();

-- Apply to dossier_folders
DROP TRIGGER IF EXISTS prevent_archived_dossier_folder_changes ON dossier_folders;
CREATE TRIGGER prevent_archived_dossier_folder_changes
  BEFORE INSERT OR UPDATE ON dossier_folders
  FOR EACH ROW
  EXECUTE FUNCTION check_dossier_not_archived();

-- Apply to dossier_events (except system archival event)
DROP TRIGGER IF EXISTS prevent_archived_dossier_event_changes ON dossier_events;
CREATE TRIGGER prevent_archived_dossier_event_changes
  BEFORE INSERT ON dossier_events
  FOR EACH ROW
  WHEN (NEW.event_type != 'archived')
  EXECUTE FUNCTION check_dossier_not_archived();

-- ============================================================
-- 3. HELPER VIEWS FOR COMMON QUERIES
-- ============================================================

-- Active dossiers with document count
CREATE OR REPLACE VIEW active_dossiers_with_counts AS
SELECT 
  d.*,
  COUNT(DISTINCT dd.document_id) as document_count,
  COUNT(DISTINCT df.folder_id) as folder_count
FROM dossiers d
LEFT JOIN dossier_documents dd ON d.id = dd.dossier_id
LEFT JOIN dossier_folders df ON d.id = df.dossier_id
WHERE d.status != 'archived'
GROUP BY d.id;

-- ============================================================
-- 4. AUDIT FUNCTION FOR AUTOMATIC EVENT LOGGING
-- ============================================================

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_dossier_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      NEW.id,
      'status_changed',
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status
      ),
      auth.uid()
    );
  END IF;
  
  IF OLD.phase IS DISTINCT FROM NEW.phase THEN
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      NEW.id,
      'phase_changed',
      jsonb_build_object(
        'from', OLD.phase,
        'to', NEW.phase
      ),
      auth.uid()
    );
  END IF;
  
  IF OLD.admin_state IS DISTINCT FROM NEW.admin_state THEN
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      NEW.id,
      'admin_state_changed',
      jsonb_build_object(
        'from', OLD.admin_state,
        'to', NEW.admin_state
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_log_dossier_changes ON dossiers;
CREATE TRIGGER auto_log_dossier_changes
  AFTER UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION log_dossier_status_change();

-- ============================================================
-- 5. DOCUMENT-DOSSIER LINKING EVENT LOGGING
-- ============================================================

CREATE OR REPLACE FUNCTION log_document_dossier_link()
RETURNS TRIGGER AS $$
DECLARE
  doc_title text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT title INTO doc_title FROM documents WHERE id = NEW.document_id;
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      NEW.dossier_id,
      'document_added',
      jsonb_build_object(
        'document_id', NEW.document_id,
        'document_title', doc_title
      ),
      auth.uid()
    );
  ELSIF TG_OP = 'DELETE' THEN
    SELECT title INTO doc_title FROM documents WHERE id = OLD.document_id;
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      OLD.dossier_id,
      'document_removed',
      jsonb_build_object(
        'document_id', OLD.document_id,
        'document_title', doc_title
      ),
      auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_log_document_link ON dossier_documents;
CREATE TRIGGER auto_log_document_link
  AFTER INSERT OR DELETE ON dossier_documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_dossier_link();

-- ============================================================
-- 6. FOLDER-DOSSIER LINKING EVENT LOGGING
-- ============================================================

CREATE OR REPLACE FUNCTION log_folder_dossier_link()
RETURNS TRIGGER AS $$
DECLARE
  folder_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO folder_name FROM folders WHERE id = NEW.folder_id;
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      NEW.dossier_id,
      'folder_added',
      jsonb_build_object(
        'folder_id', NEW.folder_id,
        'folder_name', folder_name
      ),
      auth.uid()
    );
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name INTO folder_name FROM folders WHERE id = OLD.folder_id;
    INSERT INTO dossier_events (dossier_id, event_type, payload, created_by)
    VALUES (
      OLD.dossier_id,
      'folder_removed',
      jsonb_build_object(
        'folder_id', OLD.folder_id,
        'folder_name', folder_name
      ),
      auth.uid()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_log_folder_link ON dossier_folders;
CREATE TRIGGER auto_log_folder_link
  AFTER INSERT OR DELETE ON dossier_folders
  FOR EACH ROW
  EXECUTE FUNCTION log_folder_dossier_link(); 