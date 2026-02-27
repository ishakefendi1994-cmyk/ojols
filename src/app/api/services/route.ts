import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, serviceData, id } = body;
        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const { data, error } = await supabaseAdmin
                .from('services')
                .insert([serviceData])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'UPDATE') {
            if (!id) throw new Error("ID dibutuhkan untuk update");

            const { data, error } = await supabaseAdmin
                .from('services')
                .update(serviceData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'DELETE') {
            if (!id) throw new Error("ID dibutuhkan untuk hapus");

            const { error } = await supabaseAdmin
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
        }

    } catch (err: any) {
        console.error("API Services Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
