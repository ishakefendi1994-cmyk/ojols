import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing auth header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Must be Admin.' }, { status: 403 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Delete all products
        const { error: deleteError } = await supabaseAdmin
            .from('ppob_products')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all

        if (deleteError) {
            console.error('Delete error:', deleteError);
            throw deleteError;
        }

        return NextResponse.json({ message: 'All PPOB products have been deleted successfully.' });
    } catch (error: any) {
        console.error("Reset error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
