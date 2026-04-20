const read = (key: string, required = true) => {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value ?? '';
};

const readFirst = (keys: string[], required = true) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }

  if (required) {
    throw new Error(`Missing environment variable: ${keys.join(' or ')}`);
  }

  return '';
};

export const env = {
  supabaseUrl: () => read('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseJwtSecret: () => read('SUPABASE_JWT_SECRET'),
  lineLiffId: () => readFirst(['NEXT_PUBLIC_LINE_LIFF_ID', 'NEXT_PUBLIC_LIFF_ID'], false),
  enableDevLogin: process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
};
