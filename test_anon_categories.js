require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Menggunakan anon key seperti mobile app
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    console.log("Checking with anon key...");
    const { data, error } = await supabase
        .from('merchant_categories')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Data:", data);
    }
}
check();
