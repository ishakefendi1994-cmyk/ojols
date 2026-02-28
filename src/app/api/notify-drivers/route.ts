import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
    try {
        const keyPath = path.join(process.cwd(), 'firebase-admin-key.json');
        console.log(`DEBUG: Loading Firebase Admin Key from: ${keyPath}`);

        if (fs.existsSync(keyPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("DEBUG: Firebase Admin Initialized Successfully.");
        } else {
            console.error(`DEBUG: Firebase Admin Key NOT FOUND at ${keyPath}`);
        }
    } catch (err) {
        console.error("DEBUG: Firebase Admin Init Error:", err);
    }
}

export async function POST(request: Request) {
    try {
        console.log("DEBUG: Incoming notification request...");
        const { orderId } = await request.json();
        console.log(`DEBUG: Target Order ID: ${orderId}`);

        if (!orderId) {
            return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get Order Details
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // 2. Get Service Minimum Balance
        const { data: service, error: serviceError } = await supabaseAdmin
            .from('services')
            .select('min_driver_balance')
            .eq('id', order.service_id)
            .single();

        const minBalance = service?.min_driver_balance || 0;

        // 3. Get Online Drivers with FCM Tokens
        const { data: drivers, error: driverError } = await supabaseAdmin
            .from('profiles')
            .select('id, fcm_token')
            .eq('role', 'DRIVER')
            .eq('is_online', true)
            .not('fcm_token', 'is', null);

        if (driverError) throw driverError;

        if (!drivers || drivers.length === 0) {
            return NextResponse.json({ success: true, message: "No online drivers found" });
        }

        // 4. Check Active Orders for each driver
        // Only notify drivers who don't have an active order
        const { data: activeOrders, error: activeOrdersError } = await supabaseAdmin
            .from('orders')
            .select('driver_id')
            .in('status', ['ACCEPTED', 'ON_THE_WAY_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'ON_THE_WAY_TO_DROP'])
            .not('driver_id', 'is', null);

        if (activeOrdersError) throw activeOrdersError;

        const busyDriverIds = new Set(activeOrders.map(o => o.driver_id));

        // 4.5 Get Wallets for these drivers
        const driverIds = drivers.map(d => d.id);
        const { data: wallets, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('user_id, balance')
            .in('user_id', driverIds);

        const walletMap = new Map(wallets?.map(w => [w.user_id, w.balance]) || []);

        // 5. Filter drivers based on constraints
        const availableDrivers = drivers.filter(driver => {
            const balance = walletMap.get(driver.id) || 0;
            const hasEnoughBalance = balance >= minBalance;
            const isNotBusy = !busyDriverIds.has(driver.id);
            return hasEnoughBalance && isNotBusy;
        });

        if (availableDrivers.length === 0) {
            console.log(`No available drivers for order ${orderId} (Filtered by balance/active order)`);
            return NextResponse.json({ success: true, message: "No available drivers met constraints" });
        }

        const tokens = availableDrivers.map(d => d.fcm_token).filter(t => t !== null) as string[];

        // 6. Send FCM Notification
        const message = {
            notification: {
                title: "ADA PESANAN BARU!",
                body: `Cepat ambil! Pesanan dari ${order.pickup_address} menuju ${order.dropoff_address}`,
            },
            data: {
                order_id: order.id,
                type: "NEW_ORDER",
            },
            tokens: tokens,
            android: {
                priority: 'high' as any,
                notification: {
                    sound: 'ojek_notif',
                    channelId: 'high_importance_channel',
                },
            },
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`Notification sent for order ${orderId}. Success: ${response.successCount}, Failure: ${response.failureCount}`);

        return NextResponse.json({
            success: true,
            notifiedCount: response.successCount,
            failureCount: response.failureCount
        });

    } catch (err: any) {
        console.error("API Notify Drivers Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
