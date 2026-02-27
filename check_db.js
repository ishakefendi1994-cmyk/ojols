const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: pData, error: pErr } = await supabase.from('profiles').select('*').limit(1);
    console.log('profiles columns:', pErr || Object.keys(pData[0] || {}));

    console.log('\n---');
    const { data: sData, error: sErr } = await supabase.from('services').select('*');
    console.log('services data:', sErr || sData);
}
check();
