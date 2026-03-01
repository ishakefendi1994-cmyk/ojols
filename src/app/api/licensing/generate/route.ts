import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
    const { token, client_name, domain_url, bundle_id, package_name } = await request.json();

    if (!token || !client_name) {
        return NextResponse.json({ error: 'Missing information' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Verify Token (Again for security)
    const { data: tokenData, error: tokenError } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', false)
        .single();

    if (tokenError || !tokenData) {
        return NextResponse.json({ error: 'Token invalid or already used.' }, { status: 403 });
    }

    // 2. Generate Unique License Key (OJK-XXXX-XXXX)
    const randomPart = () => crypto.randomBytes(2).toString('hex').toUpperCase();
    const licenseKey = `OJK-${randomPart()}-${randomPart()}-${randomPart()}`;

    // 3. Save License & Mark Token as Used (Atomic transaction-like)
    // In Supabase we use RPC or just multiple calls (better use RPC for atomic)
    // For now we do multiple calls:

    // Mark token used
    const { error: updateError } = await supabase
        .from('invite_tokens')
        .update({ is_used: true })
        .eq('token', token);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to consume token' }, { status: 500 });
    }

    // Insert license
    const { data: licenseData, error: licenseError } = await supabase
        .from('licenses')
        .insert([{
            license_key: licenseKey,
            client_name,
            domain_url,
            bundle_id,
            package_name,
            status: 'ACTIVE' // Bisa set 'PENDING' kalau mau manual approval
        }])
        .select()
        .single();

    if (licenseError) {
        // Rollback token (optional/ideal)
        await supabase.from('invite_tokens').update({ is_used: false }).eq('token', token);
        return NextResponse.json({ error: 'Gagal membuat lisensi: ' + licenseError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        license_key: licenseKey
    });
}
