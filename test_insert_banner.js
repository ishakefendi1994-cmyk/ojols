const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Testing insert banner...');
    const payload = {
        image_url: 'https://test.com/img.jpg',
        link_url: '',
        is_active: true,
        sort_order: 0
    };
    const { data: bData, error: bErr } = await supabase.from('banners').insert([payload]).select().single();
    console.log('Insert result:', bErr || bData);
}
check();
