import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Helper API for Admin Dashboard to bypass RLS securely
export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { action, data } = payload;

        const supabase = getSupabaseAdmin();

        // Di versi produksi, pastikan ada check session role ADMIN di sini.
        // Untuk demo, kita pakai double password protection di frontend.

        switch (action) {
            case 'fetch_licenses': {
                const { data: resData, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                return NextResponse.json({ data: resData });
            }
            case 'fetch_tokens': {
                const { data: resData, error } = await supabase.from('invite_tokens').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                return NextResponse.json({ data: resData });
            }
            case 'delete_token': {
                const { error } = await supabase.from('invite_tokens').delete().eq('id', data.id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'add_license': {
                const { error } = await supabase.from('licenses').insert([data.license]);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'toggle_license': {
                const newStatus = data.currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                const { error } = await supabase.from('licenses').update({ status: newStatus }).eq('id', data.id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            case 'delete_license': {
                const { error } = await supabase.from('licenses').delete().eq('id', data.id);
                if (error) throw error;
                return NextResponse.json({ success: true });
            }
            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
