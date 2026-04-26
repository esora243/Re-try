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
  // ブラウザ（フロントエンド）で読み込む変数は process.env.NEXT_PUBLIC_... を直接記述する
  supabaseUrl: () => process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // サーバーサイド専用の変数は元の動的読み込み（read/readFirst）のままでOK
  supabaseServiceRoleKey: () => read('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseJwtSecret: () => read('SUPABASE_JWT_SECRET', false),
  sessionSecret: () => readFirst(['SESSION_SECRET', 'NEXTAUTH_SECRET', 'LINE_CHANNEL_SECRET', 'SUPABASE_SERVICE_ROLE_KEY']),
  
  // ブラウザで読み込むLINE関連のID
  lineLiffId: () => process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID || '',
  lineClientId: () => process.env.NEXT_PUBLIC_LINE_CLIENT_ID || process.env.LINE_CHANNEL_ID || '',
  
  // URL関連
  appUrl: () => normalizeUrl(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL || ''),
  
  // Stripe関連（サーバーサイド専用）
  stripeSecretKey: () => read('STRIPE_SECRET_KEY', false),
  stripeWebhookSecret: () => read('STRIPE_WEBHOOK_SECRET', false),
  stripePremiumPriceId: () => read('STRIPE_PREMIUM_PRICE_ID', false),
  
  // その他
  premiumPriceYen: () => Number(process.env.NEXT_PUBLIC_PREMIUM_PRICE_YEN || process.env.PREMIUM_PRICE_YEN || '980'),
  enableDevLogin: process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
};