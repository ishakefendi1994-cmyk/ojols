import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Generate and Send OTP via WhatsApp
 * POST /api/otp/generate
 */
export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: "Nomor WhatsApp diperlukan" }, { status: 400 });
        }

        // 1. Generate 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const supabaseAdmin = getSupabaseAdmin();

        // 2. Store in database
        const { error: dbError } = await supabaseAdmin
            .from('otp_verifications')
            .upsert({
                phone,
                code,
                is_verified: false,
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
            }, { onConflict: 'phone' });

        if (dbError) throw dbError;

        // 3. Send via WhatsApp Service
        const targetUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:4000";
        const authKey = process.env.WHATSAPP_INTERNAL_KEY;

        const waResponse = await fetch(`${targetUrl}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone,
                message: `[OjekKu] Kode OTP Anda adalah: ${code}. Berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`,
                key: authKey
            }),
        });

        if (!waResponse.ok) {
            const errData = await waResponse.json();
            return NextResponse.json({ error: "Gagal mengirim WhatsApp", details: errData }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "OTP terkirim" });

    } catch (err: any) {
        console.error("OTP Generate Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
