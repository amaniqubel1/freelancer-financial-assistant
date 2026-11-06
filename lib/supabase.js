import { createClient } from '@supabase/supabase-js';

// One shared client used by the whole app (auth, database, file storage).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
