import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
        return NextResponse.json({ error: 'ID tidak diberikan' }, { status: 400 });
    }

    try {
        const supabaseAdmin = getSupabaseAdmin();
        // Gunakan serviceRoleKey (pasti bisa baca semua tabel bypass RLS)
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error("Admin Profile Fetch Error:", error);
            return NextResponse.json({ error: `Server DB Error: ${error.message}` }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Profil Anda tidak ditemukan di database. Pastikan Anda sudah menjalankan SQL Insert.' }, { status: 404 });
        }

        return NextResponse.json({ role: data.role });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
