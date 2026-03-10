import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { product_code, customer_no, amount } = body;

        // 1. Verify Auth
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ success: false, message: 'Missing auth header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
        }

        // 2. Validate Input
        if (!product_code || !customer_no || !amount) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        // 3. Create unique reference ID
        const refId = `PPOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 4. Create Order using PostgreSQL Function (Atomic)
        const { data: transactionId, error: orderError } = await supabase.rpc('create_ppob_order', {
            p_product_code: product_code,
            p_customer_no: customer_no,
            p_amount: amount,
            p_ref_id: refId
        });

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({
                success: false,
                message: orderError.message.includes('cukup') ? 'Saldo tidak cukup' : 'Gagal memproses pesanan'
            });
        }

        // 5. Connect to Digiflazz
        const digiflazzUser = process.env.DIGIFLAZZ_USERNAME;
        const digiflazzKey = process.env.DIGIFLAZZ_KEY;

        if (!digiflazzUser || !digiflazzKey) {
            console.error('Missing Digiflazz credentials');
            // Revert transaction if we can't process it due to config error
            await supabase.from('ppob_transactions').update({ status: 'FAILED', notes: 'Config error' }).eq('id', transactionId);
            // Revert balance
            const { data: walletData } = await supabase.from('wallets').select('id').eq('user_id', user.id).single();
            if (walletData) {
                await supabase.rpc('increment_wallet_balance', { wallet_id: walletData.id, amount: amount });
            }
            return NextResponse.json({ success: false, message: 'Server configuration error' });
        }

        const msg = digiflazzUser + digiflazzKey + refId;
        const sign = crypto.createHash('md5').update(msg).digest('hex');

        try {
            const digiResponse = await fetch('https://api.digiflazz.com/v1/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: digiflazzUser,
                    buyer_sku_code: product_code,
                    customer_no: customer_no,
                    ref_id: refId,
                    sign: sign,
                }),
            });

            const result = await digiResponse.json();

            if (!digiResponse.ok || !result.data) {
                // Determine error type based on digiflazz code
                const isInsufficientBalance = result.data?.rc === '90' || result.error?.message?.includes('Saldo');
                const isDestinationError = ['14', '16', '12', '10', '09'].includes(result.data?.rc);

                // If it fails on the provider side instantly, we refund the user immediately!
                console.error('Digiflazz API rejected immediately:', result);

                // Update specific transaction status
                await supabase.from('ppob_transactions').update({
                    status: 'FAILED',
                    notes: result.data?.message || result.error?.message || 'Transaction failed at provider'
                }).eq('id', transactionId);

                // Revert user wallet balance
                const { data: walletData } = await supabase.from('wallets').select('id').eq('user_id', user.id).single();
                if (walletData) {
                    await supabase.rpc('increment_wallet_balance', { wallet_id: walletData.id, amount: amount });
                    // Log the refund transaction
                    await supabase.from('transactions').insert({
                        wallet_id: walletData.id,
                        amount: amount,
                        type: 'REFUND',
                        description: `Refund PPOB Gagal: ${product_code}`,
                        reference_id: transactionId
                    });
                }

                let errorMessage = 'Gagal memproses ke Provider';
                if (isDestinationError) errorMessage = 'Nomor tujuan salah/tidak terdaftar';
                if (isInsufficientBalance) errorMessage = 'Gangguan pada server provider (Code: RC90)';

                return NextResponse.json({ success: false, message: errorMessage });
            }

            const apiData = result.data;

            // 6. Output based on Digiflazz Pending / Success status
            let finalStatus = 'PENDING';
            if (apiData.status === 'Sukses') finalStatus = 'SUCCESS';
            if (apiData.status === 'Gagal') finalStatus = 'FAILED';

            await supabase.from('ppob_transactions').update({
                status: finalStatus,
                serial_number: apiData.sn || null,
                notes: apiData.message || null,
                provider_ref_id: apiData.ref_id || null,
            }).eq('id', transactionId);

            // If Digiflazz responded 'Gagal' instantaneously (though rare for a 200 OK)
            if (finalStatus === 'FAILED') {
                const { data: walletData } = await supabase.from('wallets').select('id').eq('user_id', user.id).single();
                if (walletData) {
                    await supabase.rpc('increment_wallet_balance', { wallet_id: walletData.id, amount: amount });

                    await supabase.from('transactions').insert({
                        wallet_id: walletData.id,
                        amount: amount,
                        type: 'REFUND',
                        description: `Refund PPOB Gagal: ${product_code}`,
                        reference_id: transactionId
                    });
                }
                return NextResponse.json({ success: false, message: apiData.message || 'Transaksi gagal diproses provider' });
            }

            // Success or Pending
            return NextResponse.json({
                success: true,
                message: finalStatus === 'SUCCESS' ? 'Transaksi Sukses!' : 'Transaksi sedang diproses',
                data: apiData
            });

        } catch (fetchError) {
            console.error('Fetch to Digiflazz error:', fetchError);
            return NextResponse.json({
                success: true, // Still true because order is valid pending
                message: 'Pesanan diterima tapi respons lambat. Silakan cek riwayat berkala.'
            });
        }

    } catch (error: any) {
        console.error("Handler error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
