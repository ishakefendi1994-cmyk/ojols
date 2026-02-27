import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('merchant_categories')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Categories GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, categoryData, id } = body;
        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const { data, error } = await supabaseAdmin
                .from('merchant_categories')
                .insert([categoryData])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'UPDATE') {
            if (!id) throw new Error("ID dibutuhkan untuk update");

            const { data, error } = await supabaseAdmin
                .from('merchant_categories')
                .update(categoryData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'DELETE') {
            if (!id) throw new Error("ID dibutuhkan untuk hapus");

            const { error } = await supabaseAdmin
                .from('merchant_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
        }

    } catch (err: any) {
        console.error("API Categories POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
