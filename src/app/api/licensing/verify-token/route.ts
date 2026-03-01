import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    const { token } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Token is missing' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if token exists and is not used
    const { data, error } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: 'Token invalid atau sudah pernah digunakan.' }, { status: 403 });
    }

    // Optional: Cek expiry_at
    if (new Date(data.expired_at) < new Date()) {
        return NextResponse.json({ error: 'Token sudah kedaluwarsa.' }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
}
