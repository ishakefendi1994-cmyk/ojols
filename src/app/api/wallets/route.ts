import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'wallets';

        if (type === 'transactions') {
            const { data, error } = await supabaseAdmin
                .from('transactions')
                .select(`
                    *,
                    wallet:wallets(user:profiles(full_name, role))
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        } else {
            // Fetch Wallets
            const { data, error } = await supabaseAdmin
                .from('wallets')
                .select(`
                    id, balance, updated_at,
                    user:profiles!user_id(id, full_name, role, phone_number)
                `)
                .order('balance', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

    } catch (err: any) {
        console.error("API Wallets Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const body = await request.json();
        const { walletId, action, amount, description } = body;

        if (!walletId || !action || !amount || amount <= 0) {
            return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
        }

        if (action !== 'TOPUP' && action !== 'WITHDRAW') {
            return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
        }

        // 1. Get current balance
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('balance')
            .eq('id', walletId)
            .single();

        if (walletError || !wallet) {
            return NextResponse.json({ error: "Dompet tidak ditemukan" }, { status: 404 });
        }

        // 2. Adjust balance
        let newBalance = Number(wallet.balance) + Number(amount);
        if (action === 'WITHDRAW') {
            newBalance = Number(wallet.balance) - Number(amount);
            if (newBalance < 0) {
                return NextResponse.json({ error: "Saldo tidak mencukupi untuk Withdraw" }, { status: 400 });
            }
        }

        // 3. Update Wallet Balance
        const { error: updateError } = await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', walletId);

        if (updateError) throw updateError;

        // 4. Record Transaction Ledger
        const { error: trxError } = await supabaseAdmin
            .from('transactions')
            .insert({
                wallet_id: walletId,
                type: action,
                amount: action === 'WITHDRAW' ? -Number(amount) : Number(amount),
                description: description || `Admin Manual ${action}`
            });

        if (trxError) throw trxError;

        return NextResponse.json({ success: true, message: `Berhasil ${action} sebesar Rp ${amount}` });

    } catch (err: any) {
        console.error("API Wallets POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
