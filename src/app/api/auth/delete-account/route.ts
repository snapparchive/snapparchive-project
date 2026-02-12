import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Delete all user data in order
    // Note: We delete in reverse order of dependencies to avoid foreign key errors

    // 1. Delete document_tags (junction table)
    // First get all document IDs for this user
    const { data: userDocs } = await supabaseAdmin
      .from('documents')
      .select('id')
      .eq('user_id', userId);

    if (userDocs && userDocs.length > 0) {
      const docIds = userDocs.map(doc => doc.id);
      await supabaseAdmin
        .from('document_tags')
        .delete()
        .in('document_id', docIds);
    }

    // 2. Delete documents
    await supabaseAdmin.from('documents').delete().eq('user_id', userId);

    // 3. Delete folders
    await supabaseAdmin.from('folders').delete().eq('user_id', userId);

    // 4. Delete tags
    await supabaseAdmin.from('tags').delete().eq('user_id', userId);

    // 5. Delete subscription
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId);

    // 6. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 7. Delete the auth user (THIS IS THE CRITICAL STEP)
    // This permanently removes the user from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to delete user account', details: authError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 }
    );
  }
}
