import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        
        const supabaseAdmin = getSupabaseAdmin();
        let query = supabaseAdmin.from('local_pois').select('*');

        if (search) {
            query = query.textSearch('fts', search, { 
                type: 'websearch',
                config: 'indonesian' 
            });
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Addresses GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, id } = body;
        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'DELETE') {
            if (!id) throw new Error("ID dibutuhkan untuk hapus");

            const { error } = await supabaseAdmin
                .from('local_pois')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else if (action === 'CREATE') {
            const { poiData } = body;
            const { data, error } = await supabaseAdmin
                .from('local_pois')
                .insert([poiData])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'DELETE_ALL') {
             const { error } = await supabaseAdmin
                .from('local_pois')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
        }

    } catch (err: any) {
        console.error("API Addresses POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
