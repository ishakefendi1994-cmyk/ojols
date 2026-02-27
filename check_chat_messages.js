const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qiknjvzhzxonftuhbjaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpa25qdnpoenhvbmZ0dWhiamFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjA4NjIxMywiZXhwIjoyMDg3NjYyMjEzfQ.Dp615Fz2lbk256h1VqaZcAonmF77ZS5BDcQJAdS34hg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMessages() {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*, chat:chat_id(*)')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error(error);
    } else {
        console.log("Recent messages:");
        console.table(data.map(m => ({
            id: m.id,
            chat_id: m.chat_id,
            sender: m.sender_id,
            msg: m.message,
            created: m.created_at
        })));
    }
}

checkMessages();
