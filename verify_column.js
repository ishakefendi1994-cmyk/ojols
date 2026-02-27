const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumns() {
    console.log("Checking columns in 'topup_requests'...");

    // Core columns needed
    const columnsToCheck = ['id', 'user_id', 'amount', 'status', 'admin_note', 'updated_at', 'created_at'];

    for (const col of columnsToCheck) {
        const { data, error } = await supabase
            .from('topup_requests')
            .select(col)
            .limit(1);

        if (error) {
            console.log(`Column '${col}': MISSING (${error.message})`);
        } else {
            console.log(`Column '${col}': EXISTS`);
        }
    }
}

verifyColumns();
