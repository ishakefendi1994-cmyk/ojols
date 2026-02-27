const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Fetching package_types...');
    const { data: pData, error: pErr } = await supabase.from('package_types').select('*');
    console.log('package_types data:', pErr || JSON.stringify(pData, null, 2));
}
check();
