 

-- Drop existing constraints (if they exist) to avoid conflicts
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Drop indexes (if they exist) to avoid duplicates
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_auto_renew;

-- Drop columns if needed to re-add safely
ALTER TABLE subscriptions DROP COLUMN IF EXISTS cancel_at_period_end;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS amount_paid;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS auto_renew;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS last_payment_at;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS payment_failed_at;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS payment_failure_reason;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS auto_renew_off_at;

-- Recreate columns with defaults
ALTER TABLE subscriptions
ADD COLUMN cancel_at_period_end boolean DEFAULT false;

ALTER TABLE subscriptions
ADD COLUMN cancelled_at timestamptz;

ALTER TABLE subscriptions
ADD COLUMN amount_paid bigint DEFAULT 0;

ALTER TABLE subscriptions
ADD COLUMN auto_renew boolean DEFAULT true;

ALTER TABLE subscriptions
ADD COLUMN last_payment_at timestamptz;

ALTER TABLE subscriptions
ADD COLUMN payment_failed_at timestamptz;

ALTER TABLE subscriptions
ADD COLUMN payment_failure_reason text;

ALTER TABLE subscriptions
ADD COLUMN auto_renew_off_at timestamptz;

-- Recreate check constraints
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise'));

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired'));

-- Recreate indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_auto_renew ON subscriptions(auto_renew);

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'User subscription and billing information managed via Stripe';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';
COMMENT ON COLUMN subscriptions.cancelled_at IS 'Timestamp when subscription was cancelled';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'End date of free trial period';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Start of current billing period';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End of current billing period';
