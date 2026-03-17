require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBookings() {
    console.log('Checking rental_bookings WITH SERVICE ROLE...');
    
    // 1. Raw count
    const { count, error: countError } = await supabase
        .from('rental_bookings')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.error('Count error:', countError);
    } else {
        console.log('Total bookings in table:', count);
    }

    // 2. Sample data
    const { data, error } = await supabase
        .from('rental_bookings')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Query error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Fetched bookings count:', data?.length);
        if (data && data.length > 0) {
            console.log('Sample data IDs:', data.map(d => d.id));
        } else {
            console.log('No data found even with Service Role.');
        }
    }
}

checkBookings();
