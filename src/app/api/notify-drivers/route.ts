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

        // 2. Get Service Minimum Balance & Name
        const { data: service, error: serviceError } = await supabaseAdmin
            .from('services')
            .select('min_driver_balance, name')
            .eq('id', order.service_id)
            .single();

        const minBalance = service?.min_driver_balance || 0;
        const serviceName = (service?.name || '').toUpperCase();
        const isCarService = serviceName.includes('MOBIL') || serviceName.includes('CAR');

        // 3. Get Online Drivers with OneSignal IDs
        const { data: drivers, error: driverError } = await supabaseAdmin
            .from('profiles')
            .select('id, onesignal_id, vehicle_type')
            .eq('role', 'DRIVER')
            .eq('is_online', true)
            .not('onesignal_id', 'is', null);

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
            // Only enforce min balance if service requires it
            const hasEnoughBalance = minBalance > 0 ? balance >= minBalance : true;
            const isNotBusy = !busyDriverIds.has(driver.id);

            // 5.5 Vehicle Type Isolation (Align with App Logic)
            const driverType = (driver.vehicle_type || 'MOTOR').toUpperCase();
            let isTypeMatch = true;

            if (order.vehicle_type) {
                // Specific tier requested (e.g. XL, HEMAT)
                isTypeMatch = driverType === order.vehicle_type.toUpperCase();
            } else {
                // General Car vs Motor split
                const isCarDriver = driverType === 'MOBIL' || driverType === 'CAR' || 
                                   driverType.includes('XL') || driverType.includes('HEMAT');
                
                if (isCarDriver) {
                    isTypeMatch = isCarService; // Car driver only gets car services
                } else {
                    isTypeMatch = !isCarService; // Motor driver only gets motor services
                }
            }

            console.log(`DEBUG: Filter Driver ${driver.id.substring(0,8)}... | balance=${balance} | minRequired=${minBalance} | busy=${!isNotBusy} | type=${driverType} | isTypeMatch=${isTypeMatch} | onesignal=${driver.onesignal_id ? 'SET' : 'NULL'}`);

            // IF TARGETED: Only allow the specific driver
            if (order.driver_id) {
                return driver.id === order.driver_id;
            }

            // IF BROADCAST: Notify all available online drivers
            return hasEnoughBalance && isNotBusy && isTypeMatch;
        });

        console.log(`Available: ${availableDrivers.length}/${drivers.length} drivers. minBalance=${minBalance}`);

        if (availableDrivers.length === 0) {
            console.log(`No available drivers for order ${orderId}. Online=${drivers.length}, minBalance=${minBalance}, busyCount=${busyDriverIds.size}`);
            return NextResponse.json({
                success: true,
                message: "No available drivers met constraints",
                details: {
                    onlineCount: drivers.length,
                    minBalanceRequired: minBalance,
                    busyDriverCount: busyDriverIds.size
                }
            });
        }

        const tokens = availableDrivers.map(d => d.onesignal_id).filter(t => t !== null) as string[];

        // 6. Send OneSignal Notification
        const appId = process.env.ONESIGNAL_DRIVER_APP_ID;
        const restApiKey = process.env.ONESIGNAL_DRIVER_REST_API_KEY;

        if (!appId || !restApiKey) {
            console.error("DEBUG: OneSignal Driver APP ID or REST API Key is missing in .env");
            return NextResponse.json({ error: "OneSignal Driver Configuration Missing" }, { status: 500 });
        }

        const oneSignalPayload = {
            app_id: appId,
            include_subscription_ids: tokens, // Array of driver onesignal_ids
            headings: { en: "ADA PESANAN BARU! 🚗" },
            contents: { en: `Cepat ambil! Pesanan dari ${order.pickup_address} menuju ${order.dropoff_address}` },
            priority: 10,
            // android_channel_id: "orders", // Removed to use default channel (same as working chat/status)
            data: {
                order_id: order.id,
                type: "NEW_ORDER",
            }
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
            console.error("OneSignal Drivers Error:", errBody);
            return NextResponse.json({ error: "OneSignal Request Failed", details: errBody }, { status: response.status });
        }

        const responseData = await response.json();

        console.log(`Notification sent for order ${orderId}. OneSignal Recipient Count: ${responseData.recipients}`);

        return NextResponse.json({
            success: true,
            notifiedCount: responseData.recipients || 0,
            onesignal: responseData
        });

    } catch (err: any) {
        console.error("API Notify Drivers Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
