import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'PENDING';

        const { data, error } = await supabaseAdmin
            .from('withdraw_requests')
            .select(`
                *,
                user:profiles(full_name, phone_number, role)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error("API Withdrawals GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { requestId, status, adminNote, proofUrl } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
        }

        if (status !== 'APPROVED' && status !== 'REJECTED') {
            return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
        }

        // Update status withdrawal request
        // Trigger trg_handle_withdraw_request akan otomatis refund jika REJECTED
        const { error } = await supabaseAdmin
            .from('withdraw_requests')
            .update({
                status,
                admin_note: adminNote,
                proof_url: proofUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `Request penarikan berhasil ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`
        });

    } catch (err: any) {
        console.error("API Withdrawals POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
