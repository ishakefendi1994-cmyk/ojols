import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabaseAdmin
            .from('orders')
            .select(`
                *,
                customer:profiles!customer_id(full_name, phone_number),
                driver:profiles!driver_id(full_name, vehicle_plate_number),
                service:services(name, base_price)
            `)
            .order('created_at', { ascending: false });

        if (status && status !== 'ALL') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Orders GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
