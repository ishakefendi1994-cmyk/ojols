import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('referral_settings')
            .select('*');

        if (error) throw error;

        // Convert key-value array into an object
        const settings: Record<string, string> = {};
        data?.forEach((item) => {
            settings[item.key] = item.value;
        });

        return NextResponse.json({ success: true, settings });

    } catch (err: any) {
        console.error("API Referral Settings GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { referrer_reward, referee_reward, min_withdrawal } = body;

        const updates = [
            { key: 'referrer_reward', value: String(referrer_reward ?? '5000') },
            { key: 'referee_reward', value: String(referee_reward ?? '2000') },
            { key: 'min_withdrawal', value: String(min_withdrawal ?? '50000') }
        ];

        const { error } = await supabaseAdmin
            .from('referral_settings')
            .upsert(updates);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Konfigurasi referral berhasil diperbarui" });

    } catch (err: any) {
        console.error("API Referral Settings POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
