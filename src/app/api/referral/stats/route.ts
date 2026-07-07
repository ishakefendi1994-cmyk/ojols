import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        // Fetch users who have a referral code
        const { data: users, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                email,
                phone_number,
                role,
                referral_code,
                referral_balance,
                referrals:referrals!referrer_id(id)
            `)
            .order('referral_balance', { ascending: false });

        if (error) throw error;

        // Process users to include referral count and format response
        const stats = (users || []).map((user: any) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            role: user.role,
            referral_code: user.referral_code,
            referral_balance: Number(user.referral_balance || 0),
            referral_count: user.referrals ? user.referrals.length : 0
        }))
        // Filter users who have at least 1 referral or have some referral balance
        .filter((u: any) => u.referral_count > 0 || u.referral_balance > 0)
        // Sort by referral count descending, then referral balance descending
        .sort((a: any, b: any) => b.referral_count - a.referral_count || b.referral_balance - a.referral_balance);

        return NextResponse.json({ success: true, data: stats });

    } catch (err: any) {
        console.error("API Referral Stats GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
