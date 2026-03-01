import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
    try {
        const keyPath = path.join(process.cwd(), 'firebase-admin-key.json');
        if (fs.existsSync(keyPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("DEBUG: Firebase Admin Initialized.");
        }
    } catch (err) {
        console.error("DEBUG: Firebase Admin Init Error:", err);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Supabase Webhook payload or direct call
        // If from record webhook: { record: { id, customer_id, status }, old_record: { status } }
        const order = body.record || body;
        const oldStatus = body.old_record?.status;

        const customerId = order.customer_id || body.user_id || body.receiverId;
        const orderId = order.id || body.orderId || body.order_id;
        const status = order.status || body.status;

        if (!customerId || (!status && (!body.title || !body.body))) {
            return NextResponse.json({ error: "Missing required fields (customerId/user_id and status/title-body)" }, { status: 400 });
        }

        // Only send if status actually changed
        if (oldStatus && oldStatus === order.status) {
            return NextResponse.json({ success: true, message: "No status change" });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get User OneSignal ID
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('onesignal_id')
            .eq('id', customerId)
            .single();

        if (profileError || !profile?.onesignal_id) {
            return NextResponse.json({ error: "User onesignal_id not found" }, { status: 404 });
        }

        // 2. Map status or direct payload to message
        let title = body.title || "Update Pesanan";
        let messageBody = body.body || `Status pesanan Anda: ${order.status}`;
        const type = body.type || "ORDER_STATUS_UPDATE";

        if (!body.title && !body.body) {
            switch (order.status) {
                case 'ACCEPTED':
                    title = "Driver Ditemukan! ✅";
                    messageBody = "Hore! Driver sudah menerima pesanan Anda.";
                    break;
                case 'ON_THE_WAY_TO_PICKUP':
                    title = "Driver Menuju Lokasi 🛵";
                    messageBody = "Sabar ya, driver sedang menuju titik jemput.";
                    break;
                case 'ARRIVED_AT_PICKUP':
                    title = "Driver Sampai! 📍";
                    messageBody = "Driver sudah sampai di lokasi penjemputan. Segera temui driver ya!";
                    break;
                case 'ON_THE_WAY_TO_DROP':
                    title = "Dalam Perjalanan 🚀";
                    messageBody = "Pesanan Anda sedang dalam perjalanan menuju tujuan.";
                    break;
                case 'COMPLETED':
                    title = "Pesanan Selesai! ⭐";
                    messageBody = "Terima kasih sudah menggunakan layanan kami. Berikan rating ya!";
                    break;
                case 'CANCELLED':
                    title = "Pesanan Dibatalkan ❌";
                    messageBody = "Yah, pesanan Anda telah dibatalkan.";
                    break;
            }
        }

        // 3. Send OneSignal Notification
        const isDriverReceiver = body.receiver_role === 'DRIVER';

        const appId = isDriverReceiver ? process.env.ONESIGNAL_DRIVER_APP_ID : process.env.ONESIGNAL_APP_ID;
        const restApiKey = isDriverReceiver ? process.env.ONESIGNAL_DRIVER_REST_API_KEY : process.env.ONESIGNAL_REST_API_KEY;

        if (!appId || !restApiKey) {
            console.error("DEBUG: OneSignal APP ID or REST API Key is missing in .env");
            return NextResponse.json({ error: "OneSignal Configuration Missing" }, { status: 500 });
        }

        const oneSignalPayload = {
            app_id: appId,
            include_player_ids: [profile.onesignal_id],
            headings: { en: title },
            contents: { en: messageBody },
            data: {
                order_id: orderId || "",
                type: type,
                status: status || "",
                chat_id: body.chat_id || "",
                receiver_name: body.receiver_name || "",
                receiver_id: body.receiver_id || ""
            },
            android_channel_id: type === 'CHAT_MESSAGE' ? 'chat_notifications' : 'order_status', // make sure these match Android channel IDs if pre-created
            android_sound: 'ojek_notif',
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
            console.error("OneSignal Error:", errBody);
            return NextResponse.json({ error: "OneSignal Request Failed", details: errBody }, { status: response.status });
        }

        return NextResponse.json({ success: true, onesignal: await response.json() });

    } catch (err: any) {
        console.error("API Notify User Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
