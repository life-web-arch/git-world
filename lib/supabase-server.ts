import { createClient } from '@supabase/supabase-js';

// Service role client — only used server-side (API routes, auth callbacks)
// NEVER import this in any client component or expose to browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});
