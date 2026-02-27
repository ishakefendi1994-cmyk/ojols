const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    try {
        const { data, error } = await supabase.rpc('get_policies', { table_name: 'profiles' });

        if (error) {
            // If get_policies RPC doesn't exist, try a generic query to pg_policies
            const { data: policies, error: polError } = await supabase
                .from('pg_policies')
                .select('*')
                .eq('tablename', 'profiles');

            if (polError) {
                console.log('Could not fetch policies via SDK. Trying direct SQL if possible...');
                // Usually we can't do this via anon/service role without RPC, but let's check what we can see.
                return;
            }
            console.table(policies);
        } else {
            console.table(data);
        }
    } catch (err) {
        console.error(err);
    }
}

checkRLS();
