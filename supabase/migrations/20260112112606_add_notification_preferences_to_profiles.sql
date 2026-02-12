ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notify_upload BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_ocr_complete BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_ocr_failed BOOLEAN DEFAULT true;
 
-- Add comment for documentation
COMMENT ON COLUMN profiles.notify_upload IS 'Send email notification when document is uploaded';
COMMENT ON COLUMN profiles.notify_ocr_complete IS 'Send email notification when OCR processing completes';
COMMENT ON COLUMN profiles.notify_ocr_failed IS 'Send email notification when OCR processing fails';