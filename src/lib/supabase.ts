import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqgysmxhsqtkzcqftosx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Oz7_sTENmOP4K44eNceb0Q_0fOq1JvK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
