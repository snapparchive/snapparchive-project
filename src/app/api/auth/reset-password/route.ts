import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { resetToken, newPassword } = await request.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { error: 'Reset token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: otpRecord, error: fetchError } = await supabase
      .from('password_reset_otps')
      .select('*')
      .eq('id', resetToken)
      .eq('verified', true)
      .is('used_at', null)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching OTP record:', fetchError);
      return NextResponse.json(
        { error: 'Failed to validate reset token' },
        { status: 500 }
      );
    }

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    const gracePeriod = 30 * 60 * 1000;
    const extendedExpiry = new Date(expiresAt.getTime() + gracePeriod);

    if (now > extendedExpiry) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    const { data: users, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email === otpRecord.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    const { error: markUsedError } = await supabase
      .from('password_reset_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken);

    if (markUsedError) {
      console.error('Error marking OTP as used:', markUsedError);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
