 
-- Create logs table for system-wide logging
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  error_message TEXT,
  stack_trace TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_document_id ON logs(document_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level_category_timestamp ON logs(level, category, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own logs" ON logs;
DROP POLICY IF EXISTS "Service role can insert logs" ON logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON logs;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON logs
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL
  );

-- Policy: Service role can insert logs (bypasses RLS anyway)
CREATE POLICY "Service role can insert logs"
  ON logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Authenticated users can insert their own logs
CREATE POLICY "Users can insert own logs"
  ON logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to clean old logs (keeps last 30 days)
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

-- Add helpful comments
COMMENT ON TABLE logs IS 'System-wide logging table for debugging and monitoring';
COMMENT ON COLUMN logs.level IS 'Log level: DEBUG, INFO, WARN, ERROR, CRITICAL';
COMMENT ON COLUMN logs.category IS 'Log category: OCR, AUTH, UPLOAD, DATABASE, API, USER_ACTION, SYSTEM, etc.';
COMMENT ON COLUMN logs.metadata IS 'Additional context data stored as JSONB';