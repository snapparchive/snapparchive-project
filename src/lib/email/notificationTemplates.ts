// lib/email/notificationTemplates.ts

const primaryColor = '#04a3c3';
const primaryHover = '#0891b2';

export function getDocumentUploadTemplate(
  documentTitle: string,
  fileName: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Uploaded Successfully</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryHover} 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Document Uploaded Successfully</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Your document has been uploaded successfully and is now queued for OCR processing.
          </p>
          <div style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; border-radius: 4px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px; font-size: 18px; color: ${primaryColor};">Document Details</h3>
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>Title:</strong> ${documentTitle}
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>File:</strong> ${fileName}
            </p>
          </div>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
            You will receive another notification once the OCR processing is complete.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
            © 2024 SnappArchive. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Document Uploaded Successfully

Your document has been uploaded successfully and is now queued for OCR processing.

Document Details:
- Title: ${documentTitle}
- File: ${fileName}

You will receive another notification once the OCR processing is complete.

© 2024 SnappArchive. All rights reserved.
  `;

  return { html, text };
}

export function getOCRCompleteTemplate(
  documentTitle: string,
  fileName: string,
  textLength: number
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OCR Processing Complete</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">OCR Processing Complete</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Your document has been successfully processed and is now searchable.
          </p>
          <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; border-radius: 4px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px; font-size: 18px; color: #28a745;">Document Details</h3>
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>Title:</strong> ${documentTitle}
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>File:</strong> ${fileName}
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>Text Extracted:</strong> ${textLength.toLocaleString()} characters
            </p>
          </div>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
            You can now search and view the extracted text in your dashboard.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
            © 2024 SnappArchive. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
OCR Processing Complete

Your document has been successfully processed and is now searchable.

Document Details:
- Title: ${documentTitle}
- File: ${fileName}
- Text Extracted: ${textLength.toLocaleString()} characters

You can now search and view the extracted text in your dashboard.

© 2024 SnappArchive. All rights reserved.
  `;

  return { html, text };
}

export function getOCRFailedTemplate(
  documentTitle: string,
  fileName: string,
  errorMessage: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OCR Processing Failed</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">OCR Processing Failed</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Unfortunately, we couldn't process your document. You can retry the OCR processing from your dashboard.
          </p>
          <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px; font-size: 18px; color: #dc3545;">Document Details</h3>
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>Title:</strong> ${documentTitle}
            </p>
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>File:</strong> ${fileName}
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
              <strong>Error:</strong> ${errorMessage}
            </p>
          </div>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
            Please check your document and try again. If the problem persists, contact our support team.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
            © 2024 SnappArchive. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
OCR Processing Failed

Unfortunately, we couldn't process your document. You can retry the OCR processing from your dashboard.

Document Details:
- Title: ${documentTitle}
- File: ${fileName}
- Error: ${errorMessage}

Please check your document and try again. If the problem persists, contact our support team.

© 2024 SnappArchive. All rights reserved.
  `;

  return { html, text };
}