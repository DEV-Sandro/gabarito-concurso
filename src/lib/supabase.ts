import { createClient } from '@supabase/supabase-js';
import { MODO_NUVEM, SUPABASE_ANON, SUPABASE_URL } from '../config';

export const supabase = MODO_NUVEM ? createClient(SUPABASE_URL!, SUPABASE_ANON!) : null;
