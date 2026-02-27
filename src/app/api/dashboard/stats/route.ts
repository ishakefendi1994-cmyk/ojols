import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabaseAdmin = getSupabaseAdmin();

        // 1. Get total users grouped by role
        const { data: users, error: usersError } = await supabaseAdmin
            .from('profiles')
            .select('role');

        if (usersError) throw usersError;

        const userStats = {
            total: users.length,
            customers: users.filter(u => u.role === 'CUSTOMER').length,
            drivers: users.filter(u => u.role === 'DRIVER').length,
            merchants: users.filter(u => u.role === 'MERCHANT').length,
            admin: users.filter(u => u.role === 'ADMIN').length,
        };

        // 2. Get active orders count (status != COMPLETED & != CANCELLED)
        const { count: activeOrdersCount, error: ordersError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .not('status', 'in', '("COMPLETED","CANCELLED")');

        if (ordersError) throw ordersError;

        // 3. Get total completed orders
        const { count: completedOrdersCount, error: completedError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'COMPLETED');

        if (completedError) throw completedError;

        // 4. Get Admin Total Revenue from Transactions
        // Assuming admin profit comes from system 'FEE' transactions or order cuts
        // For simplicity in this initial MVP, we'll just sum all transactions marked type = 'FEE_DEDUCTION'
        const { data: feeTransactions, error: feeError } = await supabaseAdmin
            .from('transactions')
            .select('amount')
            .eq('type', 'FEE_DEDUCTION'); // Using correct ENUM value

        if (feeError) throw feeError;
        const totalRevenue = feeTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);

        // 5. Get recent 5 transactions/orders for the activity feed
        const { data: recentOrders, error: recentOrdError } = await supabaseAdmin
            .from('orders')
            .select(`
                id, status, total_price, created_at,
                service:services(name),
                customer:profiles!customer_id(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentOrdError) throw recentOrdError;


        return NextResponse.json({
            success: true,
            data: {
                users: userStats,
                orders: {
                    active: activeOrdersCount || 0,
                    completed: completedOrdersCount || 0
                },
                financials: {
                    totalRevenue
                },
                recentActivity: recentOrders || []
            }
        });

    } catch (err: any) {
        console.error("API Dashboard Stats Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
