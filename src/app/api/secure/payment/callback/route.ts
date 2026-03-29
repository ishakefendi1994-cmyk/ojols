import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
    return new Response("PAYMENT CALLBACK API OK - READY FOR POST");
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
        const formData = await request.formData().catch(async () => {
            // Fallback to JSON
            const body = await request.json().catch(() => ({}));
            return new Map(Object.entries(body));
        });

        const merchantCode = formData.get('merchantCode') as string;
        const amount = formData.get('amount') as string;
        const merchantOrderId = formData.get('merchantOrderId') as string;
        const resultCode = formData.get('resultCode') as string;
        const signature = formData.get('signature') as string;

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
            console.error('Duitku Callback: Missing required fields', { merchantCode, amount, merchantOrderId });
            return new Response('Invalid callback data', { status: 400 });
        }

        // Validate signature: md5(merchantCode + amount + apiKey + merchantOrderId)
        const apiKey = process.env.DUITKU_API_KEY || 'YOUR_SANDBOX_API_KEY';
        const expectedSignature = crypto
            .createHash('md5')
            .update(`${merchantCode}${amount}${apiKey}${merchantOrderId}`)
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
                .select('id, status')
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
