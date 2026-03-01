const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listMerchants() {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, onesignal_id')
        .eq('role', 'MERCHANT');

    if (error) {
        console.error(error);
        return;
    }

    console.log("Registered Merchants:");
    data.forEach(m => {
        console.log(`ID: ${m.id}`);
        console.log(`Name: ${m.full_name}`);
        console.log(`OneSignal: ${m.onesignal_id}`);
        console.log("-----------------------------------");
    });
}

listMerchants();
