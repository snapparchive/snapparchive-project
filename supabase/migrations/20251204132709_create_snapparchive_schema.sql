/*
  # SnappArchive Database Schema

  ## Overview
  Complete database schema for SnappArchive document management system with OCR processing,
  folders, tags, and billing capabilities.

  ## New Tables
  
  ### `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `company_name` (text, nullable)
  - `company_size` (text, nullable)
  - `use_case` (text, nullable)
  - `language` (text, default 'en')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `folders`
  Organization folders for documents
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text)
  - `parent_id` (uuid, nullable, self-reference for nested folders)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `tags`
  Tags for categorizing documents
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text)
  - `color` (text, default '#04a3c3')
  - `created_at` (timestamptz)

  ### `documents`
  Core documents table with OCR status
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `folder_id` (uuid, nullable, references folders)
  - `title` (text)
  - `file_name` (text)
  - `file_url` (text)
  - `file_size` (bigint)
  - `file_type` (text)
  - `thumbnail_url` (text, nullable)
  - `ocr_status` (text: 'pending', 'processing', 'completed', 'failed')
  - `ocr_text` (text, nullable)
  - `is_public` (boolean, default false)
  - `public_link` (text, nullable, unique)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `document_tags`
  Junction table for many-to-many relationship between documents and tags
  - `id` (uuid, primary key)
  - `document_id` (uuid, references documents)
  - `tag_id` (uuid, references tags)
  - `created_at` (timestamptz)

  ### `subscriptions`
  Stripe billing and subscription management
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `stripe_customer_id` (text, nullable)
  - `stripe_subscription_id` (text, nullable)
  - `plan` (text: 'trial', 'basic', 'pro', 'enterprise')
  - `status` (text: 'active', 'cancelled', 'expired')
  - `trial_ends_at` (timestamptz, nullable)
  - `current_period_start` (timestamptz, nullable)
  - `current_period_end` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Public documents accessible via public_link
  - Restrictive policies for authenticated users only
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  company_name text,
  company_size text,
  use_case text,
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#04a3c3',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  title text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  thumbnail_url text,
  ocr_status text DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_text text,
  is_public boolean DEFAULT false,
  public_link text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public documents"
  ON documents FOR SELECT
  TO anon
  USING (is_public = true AND public_link IS NOT NULL);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create document_tags junction table
CREATE TABLE IF NOT EXISTS document_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, tag_id)
);

ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own document tags"
  ON document_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_tags.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own document tags"
  ON document_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_tags.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own document tags"
  ON document_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_tags.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_ocr_status ON documents(ocr_status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();