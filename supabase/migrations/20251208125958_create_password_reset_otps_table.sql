-- ============================================
-- MIGRATION: Password Reset OTPs
-- ============================================

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp_hash text NOT NULL,
  verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  ip_address text,
  user_agent text
);

ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email
ON password_reset_otps(email);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
ON password_reset_otps(expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_verified
ON password_reset_otps(verified)
WHERE verified = false;

-- Cleanup function (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_otps
  WHERE expires_at < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

