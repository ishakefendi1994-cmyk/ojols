const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: pData } = await supabase.from('profiles').select('*').limit(1);
    const { data: sData } = await supabase.from('services').select('*');
    fs.writeFileSync('db_out.json', JSON.stringify({
        profiles_columns: Object.keys(pData[0] || {}),
        services: sData
    }, null, 2));
}
check();
