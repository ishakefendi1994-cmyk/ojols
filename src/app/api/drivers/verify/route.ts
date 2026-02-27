import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch drivers by verification status
export async function GET(request: NextRequest) {
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, vehicle_type, selfie_url, ktp_url, sim_url, is_verified, verification_status, rejection_reason, created_at')
        .eq('role', 'DRIVER')
        .eq('verification_status', status)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

// POST: Verify or Reject a driver
export async function POST(request: NextRequest) {
    const { action, id, reason } = await request.json();

    if (!id) return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });

    if (action === 'VERIFY') {
        const { error } = await supabase
            .from('profiles')
            .update({
                is_verified: true,
                verification_status: 'VERIFIED',
                verified_at: new Date().toISOString(),
                rejection_reason: null,
            })
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, message: 'Driver berhasil diverifikasi.' });
    }

    if (action === 'REJECT') {
        if (!reason) return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });

        const { error } = await supabase
            .from('profiles')
            .update({
                is_verified: false,
                verification_status: 'REJECTED',
                rejection_reason: reason,
            })
            .eq('id', id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, message: 'Driver berhasil ditolak.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
