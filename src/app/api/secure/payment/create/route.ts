import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

export async function GET() {
    return new Response("OK - PAYMENT CREATE API READY", {
        headers: { 'Content-Type': 'text/plain' }
    });
}



/**
 * Duitku - Create Payment Invoice
 * POST /api/payment/create
 * Body: { userId, amount, name, phone, email }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, amount, name, phone, email } = body;

        if (!userId || !amount || amount < 10000) {
            return NextResponse.json({ error: 'Data tidak valid. Minimal top-up Rp 10.000' }, { status: 400 });
        }

        const merchantCode = process.env.DUITKU_MERCHANT_CODE || 'DS15179'; // Sandbox default
        const apiKey = process.env.DUITKU_API_KEY || 'YOUR_SANDBOX_API_KEY';
        const host = request.headers.get('host') || 'ojols.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const callbackUrl = process.env.DUITKU_CALLBACK_URL || `${protocol}://${host}/api/secure/payment/callback`;
        const returnUrl = process.env.DUITKU_RETURN_URL || 'https://ojols.vercel.app/payment/success';
        const isDev = process.env.DUITKU_ENV !== 'production';
        const duitkuUrl = isDev
            ? 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'
            : 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry';

        // Unique order ID
        const timestamp = Date.now();
        const merchantOrderId = `OJEK-${userId.substring(0, 8)}-${timestamp}`;

        // MD5 Signature: merchantCode + merchantOrderId + amount + apiKey
        const signatureRaw = `${merchantCode}${merchantOrderId}${amount}${apiKey}`;
        const signature = crypto.createHash('md5').update(signatureRaw).digest('hex');

        const paymentPayload = {
            merchantCode,
            paymentAmount: amount,
            paymentMethod: 'VC',  // All payment methods - Duitku shows selection page
            merchantOrderId,
            productDetails: `Top Up Saldo OjekKu - Rp ${amount.toLocaleString('id-ID')}`,
            customerVaName: name || 'Pelanggan OjekKu',
            email: email || 'customer@ojekku.com',
            phoneNumber: phone || '',
            callbackUrl,
            returnUrl,
            signature,
            expiryPeriod: 1440, // 24 hours
            itemDetails: [
                {
                    name: 'Top Up Saldo',
                    price: amount,
                    quantity: 1
                }
            ]
        };

        // Call Duitku API
        const duitkuResponse = await fetch(duitkuUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentPayload),
        });

        if (!duitkuResponse.ok) {
            const errText = await duitkuResponse.text();
            console.error('Duitku API Error:', errText);
            return NextResponse.json({ error: 'Gagal membuat invoice Duitku', details: errText }, { status: 500 });
        }

        const duitkuResult = await duitkuResponse.json();

        if (duitkuResult.statusCode !== '00') {
            return NextResponse.json({
                error: duitkuResult.statusMessage || 'Duitku menolak permintaan',
            }, { status: 400 });
        }

        // Save topup request to Supabase
        const supabaseAdmin = getSupabaseAdmin();
        const { error: dbError } = await supabaseAdmin
            .from('topup_requests')
            .insert({
                user_id: userId,
                amount,
                proof_url: duitkuResult.paymentUrl, // reuse proof_url field for payment URL
                status: 'PENDING',
                admin_note: merchantOrderId, // store order ID in admin_note for lookup
                payment_url: duitkuResult.paymentUrl,
                duitku_reference: duitkuResult.reference,
                va_number: duitkuResult.vaNumber || null,
            });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            // Continue anyway - payment was created on Duitku side
        }

        return NextResponse.json({
            success: true,
            paymentUrl: duitkuResult.paymentUrl,
            reference: duitkuResult.reference,
            merchantOrderId,
            vaNumber: duitkuResult.vaNumber || null,
            amount,
        });

    } catch (err: any) {
        console.error('Payment Create Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
