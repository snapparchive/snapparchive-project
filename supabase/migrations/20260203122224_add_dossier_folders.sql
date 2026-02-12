-- Add dossier_folders table for linking folders to dossiers 

CREATE TABLE IF NOT EXISTS dossier_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(dossier_id, folder_id)
);

-- Enable RLS
ALTER TABLE dossier_folders ENABLE ROW LEVEL SECURITY;

-- Users can view their own dossier_folders
CREATE POLICY "Users can view own dossier_folders"
  ON dossier_folders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_folders.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

-- Users can insert their own dossier_folders
CREATE POLICY "Users can insert own dossier_folders"
  ON dossier_folders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_folders.dossier_id
      AND dossiers.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = dossier_folders.folder_id
      AND folders.user_id = auth.uid()
    )
  );

-- Users can delete their own dossier_folders
CREATE POLICY "Users can delete own dossier_folders"
  ON dossier_folders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_folders.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dossier_folders_dossier_id ON dossier_folders(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_folders_folder_id ON dossier_folders(folder_id);
 