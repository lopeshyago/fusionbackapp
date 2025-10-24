import { createClient } from '@supabase/supabase-js';

// As duas variáveis vêm de Settings → Secrets no Base44
// e são injetadas no ambiente de build.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);