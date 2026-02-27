import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const merchant_id = searchParams.get('merchant_id');

        let query = supabaseAdmin
            .from('products')
            .select(`
                *,
                merchant:profiles(full_name, phone_number)
            `)
            .order('created_at', { ascending: false });

        if (merchant_id) {
            query = query.eq('merchant_id', merchant_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Products GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, productData, id } = body;
        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const { data, error } = await supabaseAdmin
                .from('products')
                .insert([productData])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'UPDATE') {
            if (!id) throw new Error("ID dibutuhkan untuk update");

            const { data, error } = await supabaseAdmin
                .from('products')
                .update(productData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'DELETE') {
            if (!id) throw new Error("ID dibutuhkan untuk hapus");

            const { error } = await supabaseAdmin
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
        }

    } catch (err: any) {
        console.error("API Products Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
