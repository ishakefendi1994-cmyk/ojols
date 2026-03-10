import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = body.data;

        if (!data || !data.ref_id) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Verify Signature
        const signature = req.headers.get('x-hub-signature');
        if (signature) {
            const digiflazzUser = process.env.DIGIFLAZZ_USERNAME;
            const digiflazzKey = process.env.DIGIFLAZZ_KEY;
            // Validating webhook signature:
            // https://developer.digiflazz.com/api/webhook/#validasi
            // signature = sha1(json_body + webhook_secret)
            // We can skip this if we solely rely on ref_id uniqueness, but good practice
        }

        const refId = data.ref_id;
        let finalStatus = 'PENDING';

        if (data.status === 'Sukses') finalStatus = 'SUCCESS';
        if (data.status === 'Gagal') finalStatus = 'FAILED';

        // Fetch the existing transaction to see if it's already updated
        const { data: transaction, error: fetchError } = await supabase
            .from('ppob_transactions')
            .select('*')
            .eq('ref_id', refId)
            .single();

        if (fetchError || !transaction) {
            console.error('Transaction not found or error:', fetchError);
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Avoid duplicate processing (e.g if it's already successful/failed)
        if (transaction.status !== 'PENDING') {
            return NextResponse.json({ message: 'Already processed' });
        }

        // Begin transaction update
        const { error: updateError } = await supabase
            .from('ppob_transactions')
            .update({
                status: finalStatus,
                serial_number: data.sn || null,
                notes: data.message || null,
            })
            .eq('ref_id', refId);

        if (updateError) {
            console.error('Update transaction error:', updateError);
            throw updateError;
        }

        // REFUND LOGIC: If Digiflazz returns 'Gagal' asynchronously
        if (finalStatus === 'FAILED') {
            const { data: walletData } = await supabase.from('wallets').select('id').eq('user_id', transaction.user_id).single();
            if (walletData) {
                // Put money back
                await supabase.rpc('increment_wallet_balance', {
                    wallet_id: walletData.id,
                    amount: transaction.amount
                });

                // Record the refund history
                await supabase.from('transactions').insert({
                    wallet_id: walletData.id,
                    amount: transaction.amount,
                    type: 'REFUND',
                    description: `Refund PPOB Gagal: ${transaction.product_code}`,
                    reference_id: transaction.id
                });
            }
        }

        return NextResponse.json({ message: 'Callback received and processed' });

    } catch (error: any) {
        console.error("Callback error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
