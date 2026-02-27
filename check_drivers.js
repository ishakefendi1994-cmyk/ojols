const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDrivers() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, is_online, fcm_token')
            .eq('role', 'DRIVER');

        if (error) {
            console.error('Error fetching drivers:', error);
            return;
        }

        console.log('--- DRIVER PROFILES ---');
        console.table(data);

        const onlineWithToken = data.filter(d => d.is_online && d.fcm_token);
        console.log(`\nFound ${onlineWithToken.length} online drivers with FCM tokens.`);
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkDrivers();
