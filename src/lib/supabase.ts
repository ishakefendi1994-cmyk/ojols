import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Instance standar untuk client-side
export const supabase = createClient(supabaseUrl, supabaseKey);

// Instance admin untuk API Route (server-side ONLY)
// Gunakan getter function agar tidak crash jika dipanggil di client-side
export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return createClient(supabaseUrl, serviceRoleKey);
};
