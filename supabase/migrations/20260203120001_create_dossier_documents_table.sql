-- dossier_documents: link documents to dossiers (Phase 1)
-- A document can belong to at most one dossier (UNIQUE on document_id).

CREATE TABLE IF NOT EXISTS dossier_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id)
);

ALTER TABLE dossier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dossier_documents"
  ON dossier_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_documents.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own dossier_documents"
  ON dossier_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_documents.dossier_id
      AND dossiers.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = dossier_documents.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own dossier_documents"
  ON dossier_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_documents.dossier_id
      AND dossiers.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_dossier_documents_dossier_id ON dossier_documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_documents_document_id ON dossier_documents(document_id);
