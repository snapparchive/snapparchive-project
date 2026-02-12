-- ============================================
-- COMPLETE OCR SETUP — SECURE VERSION
-- ============================================ 

-- Step 1: Drop existing setup
DROP VIEW IF EXISTS ocr_stuck_documents CASCADE;
DROP VIEW IF EXISTS ocr_queue_status CASCADE;
DROP VIEW IF EXISTS ocr_performance_metrics CASCADE;

DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT n.nspname as schema_name, p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname LIKE '%ocr%'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
      func_record.schema_name, func_record.function_name, func_record.args);
  END LOOP;
END $$;

-- Step 2: Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- ============================================
-- Step 3: Config table —  
-- ============================================
CREATE TABLE IF NOT EXISTS _ocr_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO _ocr_config (key, value)
VALUES 
  ('supabase_url', 'https://ttjluwbuzzankmslywnm.supabase.co'),
  ('max_batch_size', '50'),
  ('cron_interval_seconds', '10'),
  ('max_concurrent_workers', '5'),
  ('priority_processing', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
 
DELETE FROM _ocr_config WHERE key = 'supabase_service_key';

-- Permissions lock
REVOKE ALL ON _ocr_config FROM PUBLIC, authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON _ocr_config TO service_role, postgres;

-- ============================================
-- Step 4: Documents table
-- ============================================
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_ocr_status_check;
ALTER TABLE documents DROP COLUMN IF EXISTS ocr_status CASCADE;
ALTER TABLE documents ADD COLUMN ocr_status text DEFAULT 'queued';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_text text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_error text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_retry_count int DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_priority int DEFAULT 5;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_started_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_completed_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_duration_seconds numeric;

UPDATE documents SET ocr_status = 'queued' WHERE ocr_status IS NULL;

ALTER TABLE documents
ADD CONSTRAINT documents_ocr_status_check 
CHECK (ocr_status IN ('queued', 'processing', 'completed', 'failed', 'paused'));

-- ============================================
-- Step 5: Indexes
-- ============================================
DROP INDEX IF EXISTS idx_documents_ocr_queue;
DROP INDEX IF EXISTS idx_documents_ocr_priority;
DROP INDEX IF EXISTS idx_documents_ocr_user;

CREATE INDEX idx_documents_ocr_queue 
ON documents(ocr_status, ocr_priority, file_size, created_at) 
WHERE deleted_at IS NULL AND ocr_status IN ('queued', 'failed');

CREATE INDEX idx_documents_ocr_priority
ON documents(ocr_priority, created_at)
WHERE deleted_at IS NULL AND ocr_status = 'queued';

CREATE INDEX idx_documents_ocr_user
ON documents(user_id, ocr_status)
WHERE deleted_at IS NULL;

-- ============================================
-- Functions
-- ============================================

CREATE OR REPLACE FUNCTION get_ocr_batch_smart(batch_size int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  file_url text,
  file_name text,
  file_size bigint,
  ocr_retry_count int,
  ocr_priority int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE documents
  SET 
    ocr_status = 'processing',
    ocr_started_at = COALESCE(ocr_started_at, now()),
    updated_at = now()
  WHERE documents.id IN (
    SELECT d.id FROM documents d
    WHERE d.deleted_at IS NULL
      AND d.ocr_status IN ('queued', 'processing', 'failed')
      AND d.ocr_retry_count < 3
    ORDER BY 
      d.ocr_priority ASC,
      CASE WHEN d.file_size < 1000000 THEN 0 ELSE 1 END,
      CASE WHEN d.ocr_status = 'queued' THEN 0 ELSE 1 END,
      d.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING 
    documents.id,
    documents.file_url,
    documents.file_name,
    documents.file_size,
    documents.ocr_retry_count,
    documents.ocr_priority;
END;
$$;

CREATE OR REPLACE FUNCTION update_ocr_result_with_metrics(
  document_id uuid,
  status text,
  extracted_text text DEFAULT NULL,
  error_message text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows integer;
  result json;
  old_status text;
  start_time timestamptz;
  duration numeric;
BEGIN
  SELECT ocr_status, ocr_started_at INTO old_status, start_time
  FROM documents WHERE id = document_id;
  
  IF start_time IS NOT NULL THEN
    duration := EXTRACT(EPOCH FROM (now() - start_time));
  END IF;
  
  UPDATE documents
  SET
    ocr_status = status,
    ocr_text = CASE 
      WHEN extracted_text IS NOT NULL THEN extracted_text 
      ELSE ocr_text 
    END,
    ocr_error = error_message,
    ocr_retry_count = CASE
      WHEN status = 'failed' THEN ocr_retry_count + 1
      WHEN status = 'completed' THEN 0
      ELSE ocr_retry_count
    END,
    ocr_completed_at = CASE 
      WHEN status IN ('completed', 'failed') THEN now() 
      ELSE ocr_completed_at 
    END,
    ocr_duration_seconds = CASE
      WHEN status IN ('completed', 'failed') AND duration IS NOT NULL THEN duration
      ELSE ocr_duration_seconds
    END,
    updated_at = now()
  WHERE id = document_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  result := json_build_object(
    'success', affected_rows > 0,
    'document_id', document_id,
    'old_status', old_status,
    'new_status', status,
    'duration_seconds', duration,
    'text_length', LENGTH(extracted_text)
  );
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION auto_prioritize_documents()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE documents
  SET ocr_priority = CASE
    WHEN file_type LIKE 'image/%' THEN 1
    WHEN file_type = 'application/pdf' AND file_size < 1000000 THEN 2
    WHEN file_type = 'application/pdf' AND file_size < 5000000 THEN 3
    WHEN file_type = 'application/pdf' AND file_size < 10000000 THEN 5
    ELSE 8
  END
  WHERE ocr_status = 'queued' 
    AND ocr_priority = 5
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'prioritized_count', updated_count,
    'timestamp', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION fix_stuck_ocr_processing()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_count integer := 0;
  requeued_count integer := 0;
  stuck_threshold interval := '3 minutes';
BEGIN
  UPDATE documents
  SET ocr_status = 'completed', ocr_completed_at = now(), updated_at = now()
  WHERE ocr_status = 'processing'
    AND ocr_text IS NOT NULL AND LENGTH(ocr_text) > 0
    AND deleted_at IS NULL;
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  UPDATE documents
  SET ocr_status = 'queued', updated_at = now()
  WHERE ocr_status = 'processing'
    AND (ocr_text IS NULL OR LENGTH(ocr_text) = 0)
    AND updated_at < now() - stuck_threshold
    AND deleted_at IS NULL;
  GET DIAGNOSTICS requeued_count = ROW_COUNT;
  
  RETURN json_build_object(
    'fixed_completed', fixed_count,
    'requeued', requeued_count,
    'stuck_threshold_minutes', EXTRACT(EPOCH FROM stuck_threshold) / 60,
    'timestamp', now()
  );
END;
$$;

-- ============================================
-- trigger_ocr_workers — 
-- ============================================
CREATE OR REPLACE FUNCTION trigger_ocr_workers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  supabase_key text;
  max_workers int;
  response extensions.http_response;
  worker_num int;
  triggered_count int := 0;
  queued_count int := 0;
BEGIN
  SELECT COUNT(*) INTO queued_count
  FROM documents
  WHERE deleted_at IS NULL
    AND ocr_status IN ('queued', 'failed')
    AND ocr_retry_count < 3;

  IF queued_count = 0 THEN
    RETURN json_build_object(
      'workers_triggered', 0,
      'reason', 'queue_empty',
      'timestamp', now()
    );
  END IF;
 
  SELECT value INTO supabase_url FROM _ocr_config WHERE key = 'supabase_url';
  SELECT value::int INTO max_workers FROM _ocr_config WHERE key = 'max_concurrent_workers';
 
  SELECT secret INTO supabase_key
  FROM vault.decrypted_secrets
  WHERE name = 'ocr_service_key';

  IF supabase_key IS NULL THEN
    RETURN json_build_object(
      'workers_triggered', 0,
      'reason', 'vault_secret_not_found',
      'timestamp', now()
    );
  END IF;

  FOR worker_num IN 1..max_workers LOOP
    BEGIN
      SELECT * INTO response
      FROM extensions.http((
        'POST',
        supabase_url || '/functions/v1/process-ocr',
        ARRAY[
          extensions.http_header('Authorization', 'Bearer ' || supabase_key),
          extensions.http_header('X-Worker-ID', worker_num::text),
          extensions.http_header('Content-Type', 'application/json')
        ],
        'application/json',
        json_build_object('worker_id', worker_num)::text
      )::extensions.http_request);

      IF response.status BETWEEN 200 AND 299 THEN
        triggered_count := triggered_count + 1;
        RAISE NOTICE '⚡ Worker % triggered successfully', worker_num;
      ELSE
        RAISE NOTICE '⚠️ Worker % returned status %', worker_num, response.status;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Worker % failed: %', worker_num, SQLERRM;
    END;
  END LOOP;

  RETURN json_build_object(
    'workers_triggered', triggered_count,
    'max_workers', max_workers,
    'queued_documents', queued_count,
    'timestamp', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_ocr_statistics()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'queued', COUNT(*) FILTER (WHERE ocr_status = 'queued'),
    'processing', COUNT(*) FILTER (WHERE ocr_status = 'processing'),
    'completed', COUNT(*) FILTER (WHERE ocr_status = 'completed'),
    'failed', COUNT(*) FILTER (WHERE ocr_status = 'failed'),
    'avg_processing_time_seconds', 
      AVG(ocr_duration_seconds) FILTER (WHERE ocr_status = 'completed'),
    'oldest_queued', 
      MIN(created_at) FILTER (WHERE ocr_status = 'queued'),
    'total_documents', COUNT(*)
  )
  FROM documents
  WHERE deleted_at IS NULL;
$$;

-- ============================================
-- Monitoring Views
-- ============================================

CREATE VIEW ocr_queue_status AS
SELECT 
  ocr_status,
  ocr_priority,
  COUNT(*) as count,
  AVG(file_size) as avg_file_size,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM documents
WHERE deleted_at IS NULL
GROUP BY ocr_status, ocr_priority
ORDER BY ocr_priority, ocr_status;

CREATE VIEW ocr_performance_metrics AS
SELECT 
  DATE_TRUNC('hour', ocr_completed_at) as hour,
  ocr_status,
  COUNT(*) as documents_processed,
  AVG(ocr_duration_seconds) as avg_duration,
  MIN(ocr_duration_seconds) as min_duration,
  MAX(ocr_duration_seconds) as max_duration,
  SUM(file_size) as total_bytes_processed
FROM documents
WHERE ocr_completed_at >= now() - interval '24 hours'
  AND deleted_at IS NULL
GROUP BY DATE_TRUNC('hour', ocr_completed_at), ocr_status
ORDER BY hour DESC;

CREATE VIEW ocr_stuck_documents AS
SELECT 
  id, title, file_name, ocr_status, file_size,
  LENGTH(ocr_text) as text_length, ocr_retry_count,
  EXTRACT(EPOCH FROM (now() - updated_at)) / 60 as minutes_stuck
FROM documents
WHERE deleted_at IS NULL
  AND ocr_status = 'processing'
  AND updated_at < now() - interval '3 minutes'
ORDER BY updated_at ASC;

-- ============================================
-- Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION get_ocr_batch_smart(int) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_ocr_result_with_metrics(uuid, text, text, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION auto_prioritize_documents() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION fix_stuck_ocr_processing() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION trigger_ocr_workers() TO postgres;
GRANT EXECUTE ON FUNCTION get_ocr_statistics() TO authenticated;

GRANT SELECT ON ocr_queue_status TO authenticated;
GRANT SELECT ON ocr_performance_metrics TO authenticated;
GRANT SELECT ON ocr_stuck_documents TO authenticated;

-- ============================================
-- Cron Jobs
-- ============================================

SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname LIKE 'ocr_%';

SELECT cron.schedule(
  'ocr_main_processor',
  '*/10 * * * * *',
  $$SELECT trigger_ocr_workers()$$
);

SELECT cron.schedule(
  'ocr_auto_prioritize',
  '*/30 * * * * *',
  $$SELECT auto_prioritize_documents()$$
);

SELECT cron.schedule(
  'ocr_fix_stuck',
  '*/2 * * * *',
  $$SELECT fix_stuck_ocr_processing()$$
);

-- ============================================
-- Initialization
-- ============================================

UPDATE documents 
SET ocr_status = 'queued', ocr_started_at = NULL, updated_at = now()
WHERE ocr_status IN ('processing', 'pending')
  AND deleted_at IS NULL;

SELECT auto_prioritize_documents();
SELECT fix_stuck_ocr_processing();
 