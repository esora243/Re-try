import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
};

export const createAdminClient = () => createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), options);
export const createPublicClient = () => createClient(env.supabaseUrl(), env.supabaseAnonKey(), options);
export const createAnonClient = createPublicClient;
