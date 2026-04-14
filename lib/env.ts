const read = (key: string, required = true) => {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value ?? '';
};

export const env = {
  supabaseUrl: () => read('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseJwtSecret: () => read('SUPABASE_JWT_SECRET'),
  lineLiffId: () => read('NEXT_PUBLIC_LINE_LIFF_ID', false),
  enableDevLogin: process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
};
