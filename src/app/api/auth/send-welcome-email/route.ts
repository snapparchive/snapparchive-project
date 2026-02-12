import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/emailService';
import { getWelcomeEmailTemplate } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { html, text } = getWelcomeEmailTemplate(email);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Account Created Successfully',
      html,
      text,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send welcome email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    });
  } catch (error: any) {
    console.error('Error in send-welcome-email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
