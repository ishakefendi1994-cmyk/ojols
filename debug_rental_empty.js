require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
    console.log('Checking rental_bookings...');
    
    // 1. Raw count
    const { count, error: countError } = await supabase
        .from('rental_bookings')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.error('Count error:', countError);
    } else {
        console.log('Total bookings in table:', count);
    }

    // 2. Test the specific query used in the page
    // Note: Profiles join might fail if RLS is not right for the anon key
    const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
            *,
            customer:profiles!user_id(full_name, phone_number),
            route:rental_routes(origin, destination),
            driver:profiles!driver_id(full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Query error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Fetched bookings count:', data?.length);
        if (data && data.length > 0) {
            console.log('Sample data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No data returned.');
        }
    }
}

checkBookings();
