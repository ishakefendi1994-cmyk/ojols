import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("API Promos GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { code, discount_amount, description, is_active, expires_at } = body;

        if (!code || !discount_amount) {
            return NextResponse.json({ error: "Kode promo dan nominal diskon wajib diisi" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('promo_codes')
            .insert([{
                code: code.trim().toUpperCase(),
                discount_amount: Number(discount_amount),
                description: description || null,
                is_active: is_active ?? true,
                expires_at: expires_at ? new Date(expires_at).toISOString() : null
            }])
            .select();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Promos POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { id, code, discount_amount, description, is_active, expires_at } = body;

        if (!id) {
            return NextResponse.json({ error: "ID dibutuhkan untuk pembaruan" }, { status: 400 });
        }

        const updateData: any = {};
        if (code !== undefined) updateData.code = code.trim().toUpperCase();
        if (discount_amount !== undefined) updateData.discount_amount = Number(discount_amount);
        if (description !== undefined) updateData.description = description || null;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at).toISOString() : null;

        const { data, error } = await supabaseAdmin
            .from('promo_codes')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Promos PUT Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID dibutuhkan untuk menghapus" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('promo_codes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true, message: "Kode promo berhasil dihapus" });
    } catch (err: any) {
        console.error("API Promos DELETE Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
