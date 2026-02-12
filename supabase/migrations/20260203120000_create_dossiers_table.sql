-- Dossiers: case-first container (Phase 1)
-- Each dossier has: title, type, status, admin_state, phase, owner, timestamps.
-- No workflows, no configuration. Lightweight.

CREATE TABLE IF NOT EXISTS dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Client',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'done', 'archived')),
  admin_state text NOT NULL DEFAULT 'ok' CHECK (admin_state IN ('ok', 'action_needed', 'unpaid')),
  phase text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dossiers"
  ON dossiers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own dossiers"
  ON dossiers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dossiers"
  ON dossiers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dossiers"
  ON dossiers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dossiers_user_id ON dossiers(user_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON dossiers(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at ON dossiers(updated_at DESC);

CREATE TRIGGER update_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
