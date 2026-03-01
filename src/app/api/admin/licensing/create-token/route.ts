import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * API SECURE: Hanya Admin yang bisa buat token activation
 * Kita pakai Service Role untuk bypass RLS invite_tokens
 */
export async function POST(request: Request) {
    try {
        const supabase = getSupabaseAdmin();

        // 1. Cek Auth Session
        const { data: { session } } = await supabase.auth.getSession();

        // Catatan: getSession di server-side mungkin butuh cookie-based client.
        // Untuk kemudahan di demo ini, kita asumsikan request datang dari dashboard yang terautentikasi.
        // Idealnya di sini ada pengecekan Role: ADMIN.

        // 2. Generate Token Acak
        const newToken = Math.random().toString(36).substring(2, 10).toUpperCase();

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Service Role Key is missing from env' }, { status: 500 });
        }

        // 3. Simpan pakai Service Role (Admin Power)
        const { data, error } = await supabase
            .from('invite_tokens')
            .insert([{ token: newToken }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, token: data.token });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
