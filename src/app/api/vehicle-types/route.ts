import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, id, typeData } = body;

        if (action === 'CREATE') {
            const { error } = await supabase
                .from('vehicle_types')
                .insert([typeData]);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Type created successfully' });
        }

        if (action === 'UPDATE') {
            const { error } = await supabase
                .from('vehicle_types')
                .update(typeData)
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Type updated successfully' });
        }

        if (action === 'DELETE') {
            const { error } = await supabase
                .from('vehicle_types')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Type deleted successfully' });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('API Error (vehicle-types):', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
