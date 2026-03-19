import { getSupabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        let query = supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error("API Users GET Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, userData, id } = body;
        const supabaseAdmin = getSupabaseAdmin();

        if (action === 'CREATE') {
            const { email, password, full_name, phone_number, role, vehicle_plate_number, vehicle_type, is_online, address, latitude, longitude, merchant_category, is_open_24h } = userData;

            // 1. Create the user in auth.users first
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true // Auto confirm
            });

            if (authError || !authData.user) {
                throw new Error(`Gagal membuat Autentikasi: ${authError?.message}`);
            }

            // 2. Insert into public.profiles (Using UUID from step 1)
            const profileData = {
                id: authData.user.id,
                full_name,
                phone_number: phone_number || null,
                role,
                vehicle_plate_number: vehicle_plate_number || null,
                vehicle_type: vehicle_type || null,
                is_online,
                address: address || null,
                latitude: latitude || null,
                longitude: longitude || null,
                merchant_category: merchant_category || null,
                is_open_24h: is_open_24h || false
            };

            const { data: profileResult, error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert([profileData]) // use Upsert to overwrite the trigger-created default profile
                .select();

            if (profileError) {
                // If profile fails, rollback auth creation
                await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
                throw new Error(`Gagal membuat Profil: ${profileError.message}`);
            }

            return NextResponse.json({ success: true, data: profileResult });
        }
        else if (action === 'UPDATE') {
            if (!id) throw new Error("ID dibutuhkan untuk update");

            const { data, error } = await supabaseAdmin
                .from('profiles')
                .update(userData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }
        else if (action === 'DELETE') {
            if (!id) throw new Error("ID dibutuhkan untuk hapus");

            // Delete from auth.users directly. 
            // This will CASCADE delete their public.profiles and public.wallets rows automatically.
            const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }
        else {
            return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
        }

    } catch (err: any) {
        console.error("API Users POST Error:", err);
        return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
