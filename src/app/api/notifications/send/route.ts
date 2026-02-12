// app/api/notifications/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/emailService';
import {
  getDocumentUploadTemplate,
  getOCRCompleteTemplate,
  getOCRFailedTemplate,
} from '@/lib/email/notificationTemplates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, documentId, documentTitle, fileName, textLength, errorMessage } = body;

    // Get user's notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('notify_upload, notify_ocr_complete, notify_ocr_failed')
      .eq('id', user.id)
      .single();

    // Check if notification type is enabled
    if (type === 'upload' && !profile?.notify_upload) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Upload notifications disabled' });
    }
    if (type === 'ocr_complete' && !profile?.notify_ocr_complete) {
      return NextResponse.json({ success: true, skipped: true, reason: 'OCR complete notifications disabled' });
    }
    if (type === 'ocr_failed' && !profile?.notify_ocr_failed) {
      return NextResponse.json({ success: true, skipped: true, reason: 'OCR failed notifications disabled' });
    }

    let emailContent;
    let subject;

    switch (type) {
      case 'upload':
        subject = `Document Uploaded: ${documentTitle}`;
        emailContent = getDocumentUploadTemplate(documentTitle, fileName);
        break;
      case 'ocr_complete':
        subject = `OCR Complete: ${documentTitle}`;
        emailContent = getOCRCompleteTemplate(documentTitle, fileName, textLength);
        break;
      case 'ocr_failed':
        subject = `OCR Failed: ${documentTitle}`;
        emailContent = getOCRFailedTemplate(documentTitle, fileName, errorMessage);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await sendEmail({
      to: user.email!,
      subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      console.error('Failed to send notification email:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, method: result.method });
  } catch (error: any) {
    console.error('Notification send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}