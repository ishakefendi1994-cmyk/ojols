import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Verify OTP Code
 * POST /api/otp/verify
 */
export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Check database
        const { data, error } = await supabaseAdmin
            .from('otp_verifications')
            .select('*')
            .eq('phone', phone)
            .eq('code', code)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Kode OTP salah atau sudah kadaluarsa" }, { status: 401 });
        }

        // 2. Mark as verified (optional if we consume it immediately)
        await supabaseAdmin
            .from('otp_verifications')
            .delete()
            .eq('phone', phone); // Consume OTP

        return NextResponse.json({ success: true, message: "Verifikasi berhasil" });

    } catch (err: any) {
        console.error("OTP Verify Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
