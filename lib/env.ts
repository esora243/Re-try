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

const normalizeAppUrl = (value: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value.replace(/\/$/, '');
  return `https://${value.replace(/^\/+/, '').replace(/\/$/, '')}`;
};

const readNumber = (key: string, fallback: number) => {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hasValue = (value?: string | null) => Boolean(value && value.trim().length > 0);

export const env = {
  appUrl: () => normalizeAppUrl(readFirst(['APP_URL', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_VERCEL_URL'], false)),
  sessionSecret: () => {
    const secret = readFirst(['SESSION_SECRET', 'NEXTAUTH_SECRET', 'LINE_CHANNEL_SECRET'], false);
    if (secret) return secret;
    if (process.env.NODE_ENV !== 'production') return 'retry-local-session-secret';
    throw new Error('Missing environment variable: SESSION_SECRET or NEXTAUTH_SECRET or LINE_CHANNEL_SECRET');
  },
  databaseUrl: () => read('DATABASE_URL', false),
  supabaseUrl: () => read('NEXT_PUBLIC_SUPABASE_URL', false),
  supabaseAnonKey: () => read('NEXT_PUBLIC_SUPABASE_ANON_KEY', false),
  supabaseServiceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY', false),
  hasSupabaseConfig: () => hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  hasSupabaseAdminConfig: () => hasValue(process.env.NEXT_PUBLIC_SUPABASE_URL) && hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
  lineLiffId: () => readFirst(['NEXT_PUBLIC_LIFF_ID', 'NEXT_PUBLIC_LINE_LIFF_ID'], false),
  lineChannelId: () => readFirst(['LINE_CHANNEL_ID', 'NEXT_PUBLIC_LINE_CHANNEL_ID', 'NEXT_PUBLIC_LINE_CLIENT_ID'], false),
  enableDevLogin: process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true',
  stripeSecretKey: () => read('STRIPE_SECRET_KEY', false),
  stripeWebhookSecret: () => read('STRIPE_WEBHOOK_SECRET', false),
  stripePremiumAmount: () => readNumber('STRIPE_PREMIUM_AMOUNT', 30000),
  stripePremiumName: () => process.env.STRIPE_PREMIUM_NAME?.trim() || 'Re-try 永久ライセンス',
  stripePremiumDescription: () =>
    process.env.STRIPE_PREMIUM_DESCRIPTION?.trim() ||
    '一度のお支払いで、過去問解説・掲示板・学習ツールなど Re-try のすべての機能をずっと使えます。',
  businessServiceName: () => process.env.BUSINESS_SERVICE_NAME?.trim() || 'Re-try',
  businessOperatorType: () => process.env.BUSINESS_OPERATOR_TYPE?.trim() || '個人事業',
  businessSellerName: () => process.env.BUSINESS_SELLER_NAME?.trim() || 'Re-try 運営事務局',
  businessRepresentative: () => process.env.BUSINESS_REPRESENTATIVE_NAME?.trim() || '運営責任者',
  businessContactEmail: () => process.env.BUSINESS_CONTACT_EMAIL?.trim() || 'support@example.com',
  businessAddressNotice: () => process.env.BUSINESS_ADDRESS_NOTICE?.trim() || '請求があった場合は遅滞なく開示します。',
  businessPhoneNotice: () => process.env.BUSINESS_PHONE_NOTICE?.trim() || '請求があった場合は遅滞なく開示します。'
};
