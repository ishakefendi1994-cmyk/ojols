import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { category, markup } = body;

        if (!category || typeof markup !== 'number' || markup < 0) {
            return NextResponse.json({ error: 'Invalid category or markup value' }, { status: 400 });
        }

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

        // Update all products in the specified category
        let query = supabaseAdmin
            .from('ppob_products')
            .update({ markup: markup });

        if (category !== 'ALL') {
            query = query.eq('category', category.toLowerCase());
        } else {
            // Just a dummy condition to satisfy update requirements if needed, usually empty eq is enough but let's be safe
            query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }

        const { error: updateError } = await query;

        if (updateError) {
            console.error('Update bulk error:', updateError);
            throw updateError;
        }

        return NextResponse.json({ message: `Bulk markup updated to ${markup} for ${category}` });
    } catch (error: any) {
        console.error("Bulk markup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
