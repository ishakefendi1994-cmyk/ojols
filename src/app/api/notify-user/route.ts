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

        if (!order.id || !order.customer_id || !order.status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Only send if status actually changed
        if (oldStatus && oldStatus === order.status) {
            return NextResponse.json({ success: true, message: "No status change" });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get User FCM Token
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('fcm_token')
            .eq('id', order.customer_id)
            .single();

        if (profileError || !profile?.fcm_token) {
            return NextResponse.json({ error: "User token not found" }, { status: 404 });
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

        // 3. Send FCM
        const fcmMessage = {
            notification: {
                title: title,
                body: messageBody,
            },
            data: {
                order_id: order.id || "",
                type: type,
                status: order.status || "",
            },
            token: profile.fcm_token,
            android: {
                priority: 'high' as any,
                notification: {
                    sound: 'ojek_notif',
                    channelId: type === 'CHAT_MESSAGE' ? 'chat_notifications' : 'order_status',
                },
            },
        };

        await admin.messaging().send(fcmMessage as any);

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("API Notify User Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
