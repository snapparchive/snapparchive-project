import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/emailService';
import { getOTPEmailTemplate } from '@/lib/email/templates';
import { rateLimit, getRateLimitHeaders } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    const rateLimitResult = rateLimit(`forgot-password:${email}`, {
      interval: 60 * 60 * 1000,
      maxRequests: 3,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    const userExists = users?.users.some(u => u.email === email);

    if (!userExists) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10); // Hash the OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({
        email,
        otp_hash: otpHash, // Changed from 'otp' to 'otp_hash'
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return NextResponse.json(
        { error: 'Failed to create OTP' },
        { status: 500 }
      );
    }

    const { html, text } = getOTPEmailTemplate(otp);
    const emailResult = await sendEmail({
      to: email,
      subject: 'Password Reset OTP',
      html,
      text,
    });

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}