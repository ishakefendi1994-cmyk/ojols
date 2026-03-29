import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

export async function GET() {
    return new Response("OK - PAYMENT CALLBACK API READY", {
        headers: { 'Content-Type': 'text/plain' }
    });
}



/**
 * Duitku - Payment Callback/Webhook
 * POST /api/payment/callback
 * Called by Duitku server after payment success/failure
 * Content-Type: application/x-www-form-urlencoded
 */
export async function POST(request: Request) {
    try {
        // Duitku sends form-encoded data
        const bodyText = await request.text();
        const params = new URLSearchParams(bodyText);
        
        const merchantCode = params.get('merchantCode');
        const amount = params.get('amount');
        const merchantOrderId = params.get('merchantOrderId');
        const resultCode = params.get('resultCode');
        const signature = params.get('signature');

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
            console.error('Duitku Callback: Missing required fields', { merchantCode, amount, merchantOrderId, bodyText });
            return new Response('Invalid callback data', { status: 400 });
        }

        // Validate signature: md5(merchantCode + amount + apiKey + merchantOrderId)
        const apiKey = process.env.DUITKU_API_KEY || 'f62562ba13abc40d26104da10abbc41a';
        const expectedSignature = crypto
            .createHash('md5')
            .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Duitku Callback: Invalid signature!', { received: signature, expected: expectedSignature });
            return new Response('Invalid signature', { status: 401 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // resultCode '00' = success
        if (resultCode === '00') {
            // Find topup_request by merchantOrderId (stored in admin_note)
            const { data: topupRequest, error: findError } = await supabaseAdmin
                .from('topup_requests')
                .select('id, status, user_id')
                .eq('admin_note', merchantOrderId)
                .single();

            if (findError || !topupRequest) {
                console.error('Duitku Callback: Order not found', merchantOrderId);
                // Still return 200 to Duitku so it doesn't retry
                return new Response('OK', { status: 200 });
            }

            // Prevent double-processing
            if (topupRequest.status === 'APPROVED') {
                console.log('Duitku Callback: Already approved, skipping', merchantOrderId);
                return new Response('OK', { status: 200 });
            }

            // Update status to APPROVED - trigger will auto-credit wallet
            const { error: updateError } = await supabaseAdmin
                .from('topup_requests')
                .update({
                    status: 'APPROVED',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', topupRequest.id);

            if (updateError) {
                console.error('Duitku Callback: Failed to update topup status', updateError);
                return new Response('DB Error', { status: 500 });
            }

            console.log(`✅ Duitku Callback: TOP UP APPROVED for order ${merchantOrderId}, amount ${amount}`);

            // --- DIRECT WALLET CREDIT (Since trigger might be missing) ---
            try {
                // 1. Get Wallet
                const { data: wallet, error: walletError } = await supabaseAdmin
                    .from('wallets')
                    .select('id, balance')
                    .eq('user_id', topupRequest.user_id)
                    .single();

                if (!walletError && wallet) {
                    // 2. Update Balance
                    const { error: balError } = await supabaseAdmin
                        .from('wallets')
                        .update({ 
                            balance: Number(wallet.balance) + Number(amount),
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', wallet.id);

                    if (!balError) {
                        // 3. Record Transaction
                        await supabaseAdmin
                            .from('transactions')
                            .insert({
                                wallet_id: wallet.id,
                                type: 'TOPUP',
                                amount: Number(amount),
                                description: `Admin: Top up otomatis Duitku (${merchantOrderId})`
                            });
                        console.log(`💰 Wallet Updated: +${amount} to user ${topupRequest.user_id}`);
                    }
                }
            } catch (creditErr) {
                console.error('Failed to credit wallet directly:', creditErr);
            }
            // -------------------------------------------------------------

        } else {
            // Payment failed or cancelled - update status to REJECTED
            await supabaseAdmin
                .from('topup_requests')
                .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
                .eq('admin_note', merchantOrderId);

            console.log(`❌ Duitku Callback: Payment failed for order ${merchantOrderId}, resultCode: ${resultCode}`);
        }

        // MUST return 200 OK so Duitku stops retrying
        return new Response('OK', { status: 200 });

    } catch (err: any) {
        console.error('Duitku Callback Error:', err);
        // Still return 200 to prevent Duitku retrying indefinitely
        return new Response('OK', { status: 200 });
    }
}
