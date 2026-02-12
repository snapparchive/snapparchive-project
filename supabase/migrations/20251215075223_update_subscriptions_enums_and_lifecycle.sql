-- ============================================
-- MIGRATION: Subscriptions Enhancements
-- ============================================

-- Add Stripe lifecycle fields
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Create ENUM for subscription plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_enum'
  ) THEN
    CREATE TYPE subscription_plan_enum AS ENUM (
      'trial',
      'basic',
      'pro',
      'enterprise'
    );
  END IF;
END $$;

-- Drop CHECK constraint for plan
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

-- Drop default for plan before conversion
ALTER TABLE subscriptions ALTER COLUMN plan DROP DEFAULT;

-- Convert plan column to ENUM
ALTER TABLE subscriptions
ALTER COLUMN plan
TYPE subscription_plan_enum
USING plan::subscription_plan_enum;

-- Re-add default with ENUM type
ALTER TABLE subscriptions 
ALTER COLUMN plan 
SET DEFAULT 'trial'::subscription_plan_enum;

-- Create ENUM for subscription status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum'
  ) THEN
    CREATE TYPE subscription_status_enum AS ENUM (
      'active',
      'cancelled',
      'expired'
    );
  END IF;
END $$;

-- Drop CHECK constraint for status
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Drop default for status before conversion
ALTER TABLE subscriptions ALTER COLUMN status DROP DEFAULT;

-- Convert status column to ENUM
ALTER TABLE subscriptions
ALTER COLUMN status
TYPE subscription_status_enum
USING status::subscription_status_enum;

-- Re-add default with ENUM type
ALTER TABLE subscriptions 
ALTER COLUMN status 
SET DEFAULT 'active'::subscription_status_enum;