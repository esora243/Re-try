import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const createAdminClient = () =>
  createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

export const createAnonClient = (jwt?: string): SupabaseClient =>
  createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    global: jwt
      ? {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        }
      : undefined,
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
