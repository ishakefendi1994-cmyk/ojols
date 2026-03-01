import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        console.log(`DEBUG: Notify Merchant Request for Order: ${orderId}`);
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get Order and Merchant Details
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*, profiles!merchant_id(onesignal_id)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error(`DEBUG: Order not found: ${orderId}`, orderError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        console.log(`DEBUG: Order Data:`, JSON.stringify(order, null, 2));
        const merchantOneSignalId = (order.profiles as any)?.onesignal_id;
        console.log(`DEBUG: Merchant OneSignal ID from DB: ${merchantOneSignalId}`);

        if (!merchantOneSignalId) {
            return NextResponse.json({ error: "Merchant notification ID not found" }, { status: 404 });
        }

        // 2. Prepare Notification
        const appId = process.env.ONESIGNAL_MERCHANT_APP_ID;
        const restApiKey = process.env.ONESIGNAL_MERCHANT_REST_API_KEY;

        if (!appId || !restApiKey) {
            console.error("DEBUG: OneSignal APP ID or REST API Key is missing");
            return NextResponse.json({ error: "OneSignal Configuration Missing" }, { status: 500 });
        }

        const oneSignalPayload = {
            app_id: appId,
            include_player_ids: [merchantOneSignalId],
            headings: { en: "PESANAN BARU MASUK! 🛍️" },
            contents: { en: `Anda menerima pesanan baru senilai Rp ${order.total_price.toLocaleString('id-ID')}` },
            priority: 10,
            data: {
                order_id: order.id,
                type: "NEW_ORDER_MERCHANT",
            },
            android_channel_id: "order_channel" // Optional: for custom sound/importance
        };

        const response = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Basic ${restApiKey}`,
            },
            body: JSON.stringify(oneSignalPayload),
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`DEBUG: OneSignal Merchant Error (Order ${orderId}):`, errBody);
            return NextResponse.json({ error: "OneSignal Request Failed", details: errBody }, { status: response.status });
        }

        const resData = await response.json();
        console.log(`DEBUG: OneSignal Notification Sent Successfully (Order ${orderId}):`, JSON.stringify(resData, null, 2));

        return NextResponse.json({ success: true, message: "Notification sent to merchant", onesignal: resData });

    } catch (err: any) {
        console.error("API Notify Merchant Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
