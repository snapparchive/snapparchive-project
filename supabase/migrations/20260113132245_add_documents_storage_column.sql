-- ============================================
-- MIGRATION: Subscriptions Enhancements
-- ============================================

-- Step 1: Add document/storage limit columns
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS monthly_document_limit int DEFAULT 200,
ADD COLUMN IF NOT EXISTS storage_limit_gb int DEFAULT 15,
ADD COLUMN IF NOT EXISTS documents_uploaded_this_month int DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month_start date DEFAULT DATE_TRUNC('month', CURRENT_DATE)::date;

-- Step 2: Update existing subscriptions with proper limits
UPDATE subscriptions
SET 
  monthly_document_limit = CASE 
    WHEN plan = 'trial' THEN 50
    WHEN plan = 'core' THEN 200
    WHEN plan = 'pro' THEN 400
    WHEN plan = 'business' THEN 700
    ELSE 200
  END,
  storage_limit_gb = CASE 
    WHEN plan = 'trial' THEN 5
    WHEN plan = 'core' THEN 15
    WHEN plan = 'pro' THEN 50
    WHEN plan = 'business' THEN 100
    ELSE 15
  END;

-- Step 3: Create function to check if user can upload
CREATE OR REPLACE FUNCTION can_user_upload_document(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  current_storage_gb numeric;
  current_documents_count int;
  current_month_docs int;
BEGIN
  SELECT 
    s.plan,
    s.status,
    s.monthly_document_limit,
    s.storage_limit_gb,
    s.documents_uploaded_this_month,
    s.current_month_start,
    s.trial_ends_at,
    s.current_period_end,
    s.auto_renew
  INTO subscription_record
  FROM subscriptions s
  WHERE s.user_id = user_id_param;

  IF subscription_record IS NULL THEN
    RETURN json_build_object(
      'canUpload', false,
      'reason', 'no_subscription',
      'message', 'Please subscribe to a plan to upload documents'
    );
  END IF;

  IF subscription_record.status != 'active' THEN
    RETURN json_build_object(
      'canUpload', false,
      'reason', 'inactive_subscription',
      'message', 'Your subscription is not active'
    );
  END IF;

  SELECT COALESCE(SUM(file_size), 0) / (1024.0 * 1024.0 * 1024.0)
  INTO current_storage_gb
  FROM documents
  WHERE user_id = user_id_param AND deleted_at IS NULL;

  SELECT COUNT(*)
  INTO current_documents_count
  FROM documents
  WHERE user_id = user_id_param AND deleted_at IS NULL;

  IF subscription_record.current_month_start < DATE_TRUNC('month', CURRENT_DATE)::date THEN
    UPDATE subscriptions
    SET 
      documents_uploaded_this_month = 0,
      current_month_start = DATE_TRUNC('month', CURRENT_DATE)::date
    WHERE user_id = user_id_param;

    current_month_docs := 0;
  ELSE
    current_month_docs := subscription_record.documents_uploaded_this_month;
  END IF;

  IF current_storage_gb >= subscription_record.storage_limit_gb THEN
    RETURN json_build_object(
      'canUpload', false,
      'reason', 'storage_limit_exceeded',
      'message', format('Storage limit exceeded. You have used %.2f GB of %s GB', 
                       current_storage_gb, subscription_record.storage_limit_gb),
      'currentStorageGB', ROUND(current_storage_gb::numeric, 2),
      'storageLimitGB', subscription_record.storage_limit_gb,
      'currentDocuments', current_documents_count,
      'monthlyLimit', subscription_record.monthly_document_limit,
      'documentsThisMonth', current_month_docs
    );
  END IF;

  IF current_month_docs >= subscription_record.monthly_document_limit THEN
    RETURN json_build_object(
      'canUpload', false,
      'reason', 'monthly_limit_exceeded',
      'message', format('Monthly upload limit exceeded. You have uploaded %s of %s documents this month', 
                       current_month_docs, subscription_record.monthly_document_limit),
      'currentStorageGB', ROUND(current_storage_gb::numeric, 2),
      'storageLimitGB', subscription_record.storage_limit_gb,
      'currentDocuments', current_documents_count,
      'monthlyLimit', subscription_record.monthly_document_limit,
      'documentsThisMonth', current_month_docs
    );
  END IF;

  RETURN json_build_object(
    'canUpload', true,
    'reason', 'ok',
    'message', 'You can upload documents',
    'currentStorageGB', ROUND(current_storage_gb::numeric, 2),
    'storageLimitGB', subscription_record.storage_limit_gb,
    'storageUsedPercent', ROUND((current_storage_gb / subscription_record.storage_limit_gb * 100)::numeric, 2),
    'currentDocuments', current_documents_count,
    'monthlyLimit', subscription_record.monthly_document_limit,
    'documentsThisMonth', current_month_docs,
    'documentsRemainingThisMonth', subscription_record.monthly_document_limit - current_month_docs
  );
END;
$$;

-- Step 4: Function to increment monthly uploads
CREATE OR REPLACE FUNCTION increment_monthly_uploads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    UPDATE subscriptions
    SET 
      documents_uploaded_this_month = documents_uploaded_this_month + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 5: Trigger for document uploads
DROP TRIGGER IF EXISTS track_monthly_uploads ON documents;
CREATE TRIGGER track_monthly_uploads
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION increment_monthly_uploads();

-- Step 6: Grant execution permission
GRANT EXECUTE ON FUNCTION can_user_upload_document(uuid) TO authenticated;

-- Step 7: Create monitoring view
CREATE OR REPLACE VIEW user_plan_usage AS
SELECT 
  s.user_id,
  p.full_name,
  p.company_name,
  s.plan,
  s.status,
  s.monthly_document_limit,
  s.storage_limit_gb,
  s.documents_uploaded_this_month,
  ROUND((COALESCE(SUM(d.file_size), 0) / (1024.0 * 1024.0 * 1024.0))::numeric, 2) as current_storage_gb,
  COUNT(d.id) FILTER (WHERE d.deleted_at IS NULL) as total_documents,
  ROUND(((s.documents_uploaded_this_month::float / s.monthly_document_limit) * 100)::numeric, 2) as monthly_usage_percent,
  ROUND(((COALESCE(SUM(d.file_size), 0) / (1024.0 * 1024.0 * 1024.0)) / s.storage_limit_gb * 100)::numeric, 2) as storage_usage_percent
FROM subscriptions s
JOIN profiles p ON p.id = s.user_id
LEFT JOIN documents d ON d.user_id = s.user_id AND d.deleted_at IS NULL
GROUP BY s.user_id, p.full_name, p.company_name, s.plan, s.status, 
         s.monthly_document_limit, s.storage_limit_gb, s.documents_uploaded_this_month;

GRANT SELECT ON user_plan_usage TO authenticated;

-- Step 8: Reset monthly counters for all users
UPDATE subscriptions
SET 
  documents_uploaded_this_month = (
    SELECT COUNT(*)
    FROM documents d
    WHERE d.user_id = subscriptions.user_id
      AND d.deleted_at IS NULL
      AND d.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ),
  current_month_start = DATE_TRUNC('month', CURRENT_DATE)::date;

-- Step 9: Verification queries
SELECT '✅ Plan Limits Configuration' as info;

SELECT 
  plan,
  COUNT(*) as users,
  AVG(monthly_document_limit) as avg_monthly_limit,
  AVG(storage_limit_gb) as avg_storage_limit_gb
FROM subscriptions
GROUP BY plan
ORDER BY 
  CASE plan
    WHEN 'trial' THEN 1
    WHEN 'core' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'business' THEN 4
  END;

SELECT '📊 Current User Usage' as info;
SELECT * FROM user_plan_usage ORDER BY storage_usage_percent DESC LIMIT 10;
