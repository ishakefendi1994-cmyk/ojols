const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listServices() {
    const { data, error } = await supabase.from('services').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Services:', data);
    }
}
listServices();
