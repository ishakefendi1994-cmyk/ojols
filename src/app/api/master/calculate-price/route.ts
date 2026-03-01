import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * MASTER API: Hitung harga pusat dengan validasi lisensi
 */
export async function POST(request: Request) {
    const licenseKey = request.headers.get('x-license-key');
    const { distance, service_type } = await request.json();

    if (!licenseKey) {
        return NextResponse.json({ error: 'License key is missing' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Validasi Lisensi di Database (Supabase)
    const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

    if (error || !license) {
        return NextResponse.json({ error: 'License key is invalid' }, { status: 403 });
    }

    if (license.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'License is suspended or expired' }, { status: 403 });
    }

    // 2. Logic Inti: Rumus Harga (Tidak bisa dimanipulasi pembeli)
    let basePrice = 5000;
    let pricePerKm = service_type === 'car' ? 3000 : 2000;
    const totalPrice = basePrice + (distance * pricePerKm);

    // 3. Kembalikan hasil
    return NextResponse.json({
        price: totalPrice,
        service: service_type,
        currency: 'IDR',
        timestamp: new Date().toISOString()
    });
}
