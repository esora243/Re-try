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

const normalizeUrl = (value: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
};

export const env = {
  supabaseUrl: () => read('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => read('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseJwtSecret: () => read('SUPABASE_JWT_SECRET', false),
  sessionSecret: () => readFirst(['SESSION_SECRET', 'NEXTAUTH_SECRET', 'LINE_CHANNEL_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']),
  lineLiffId: () => readFirst(['NEXT_PUBLIC_LINE_LIFF_ID', 'NEXT_PUBLIC_LIFF_ID'], false),
  lineClientId: () => readFirst(['NEXT_PUBLIC_LINE_CLIENT_ID', 'LINE_CHANNEL_ID'], false),
  appUrl: () => normalizeUrl(readFirst(['NEXT_PUBLIC_APP_URL', 'APP_URL', 'VERCEL_URL'], false)),
  stripeSecretKey: () => read('STRIPE_SECRET_KEY', false),
  stripeWebhookSecret: () => read('STRIPE_WEBHOOK_SECRET', false),
  stripePremiumPriceId: () => read('STRIPE_PREMIUM_PRICE_ID', false),
  premiumPriceYen: () => Number(readFirst(['NEXT_PUBLIC_PREMIUM_PRICE_YEN', 'PREMIUM_PRICE_YEN'], false) || '980'),
  enableDevLogin: process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
};
