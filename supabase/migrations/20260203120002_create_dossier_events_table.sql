-- dossier_events: timeline / history for a dossier (Phase 1)
-- System events (document_added, status_changed, phase_changed, etc.) and user notes.

CREATE TABLE IF NOT EXISTS dossier_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- event_type: 'document_added', 'document_removed', 'status_changed', 'phase_changed', 'admin_state_changed', 'note', 'created'
ALTER TABLE dossier_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dossier_events"
  ON dossier_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_events.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own dossier_events"
  ON dossier_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_events.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

-- No update/delete on events (append-only timeline)
CREATE INDEX IF NOT EXISTS idx_dossier_events_dossier_id ON dossier_events(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_events_created_at ON dossier_events(dossier_id, created_at DESC);
