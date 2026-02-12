import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all non-verified OTPs for this email that haven't expired
    const { data: otpRecords, error: fetchError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching OTP:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
        { status: 500 }
      );
    }

    if (!otpRecords || otpRecords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check OTP against all records (in case multiple were sent)
    let validRecord = null;
    for (const record of otpRecords) {
      const isValid = await bcrypt.compare(otp, record.otp_hash);
      if (isValid) {
        validRecord = record;
        break;
      }
    }

    if (!validRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('password_reset_otps')
      .update({ verified: true })
      .eq('id', validRecord.id);

    if (updateError) {
      console.error('Error updating OTP:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify OTP' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: validRecord.id,
    });
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}