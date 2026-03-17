import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, table, data, id } = body;
        const supabaseAdmin = getSupabaseAdmin();

        const validTables = ['travel_routes', 'travel_vehicles', 'travel_schedules', 'travel_bookings', 'rental_routes', 'rental_route_drivers'];
        if (!validTables.includes(table)) {
            return NextResponse.json({ error: "Tabel tidak valid" }, { status: 400 });
        }

        if (action === 'CREATE') {
            const { data: result, error } = await supabaseAdmin
                .from(table)
                .insert([data])
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }
        else if (action === 'UPDATE') {
            if (!id) throw new Error("ID dibutuhkan untuk update");

            const { data: result, error } = await supabaseAdmin
                .from(table)
                .update(data)
                .eq('id', id)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }
        else if (action === 'DELETE') {
            if (!id) throw new Error("ID dibutuhkan untuk hapus");

            const { error } = await supabaseAdmin
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
        }

    } catch (err: any) {
        console.error("API Travel Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
