import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '@/lib/env';

type StripePrimitive = string | number | boolean;
type StripeValue = StripePrimitive | StripePrimitive[] | null | undefined;

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | null;
};

type StripeCustomer = {
  id: string;
};

const getStripeSecretKey = () => {
  const secretKey = env.stripeSecretKey();
  if (!secretKey) {
    throw new Error('Stripe の環境変数が未設定です。STRIPE_SECRET_KEY を設定してください。');
  }
  return secretKey;
};

const appendParam = (params: URLSearchParams, key: string, value: StripeValue) => {
  if (value === undefined || value === null || value === '') return;

  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(key, String(item));
    }
    return;
  }

  params.append(key, String(value));
};

const stripeRequest = async <T>(path: string, payload: Record<string, StripeValue>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    appendParam(params, key, value);
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  const body = (await response.json().catch(() => null)) as { error?: { message?: string } } & T;
  if (!response.ok) {
    throw new Error(body?.error?.message ?? 'Stripe API の呼び出しに失敗しました。');
  }

  return body as T;
};

export const createStripeCustomer = async (input: {
  userId: string;
  displayName: string;
  lineUserId: string;
}) => {
  return stripeRequest<StripeCustomer>('/v1/customers', {
    name: input.displayName,
    'metadata[userId]': input.userId,
    'metadata[lineUserId]': input.lineUserId
  });
};

export const createStripeCheckoutSession = async (input: {
  customerId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  const priceId = env.stripePremiumPriceId();
  const payload: Record<string, StripeValue> = {
    mode: 'payment',
    customer: input.customerId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.userId,
    locale: 'ja',
    allow_promotion_codes: true,
    'payment_method_types[]': ['card', 'paypay'],
    'metadata[userId]': input.userId,
    'line_items[0][quantity]': 1
  };

  if (priceId) {
    payload['line_items[0][price]'] = priceId;
  } else {
    payload['line_items[0][price_data][currency]'] = 'jpy';
    payload['line_items[0][price_data][unit_amount]'] = env.premiumPriceYen();
    payload['line_items[0][price_data][product_data][name]'] = 'Re-try Pro プレミアム';
    payload['line_items[0][price_data][product_data][description]'] = '過去問の詳細解説・プレミアムコミュニティへのアクセス';
  }

  return stripeRequest<StripeCheckoutSession>('/v1/checkout/sessions', payload);
};

export const verifyStripeWebhookSignature = (payload: string, signatureHeader: string | null) => {
  const webhookSecret = env.stripeWebhookSecret();
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret が未設定です。STRIPE_WEBHOOK_SECRET を設定してください。');
  }

  if (!signatureHeader) {
    return false;
  }

  const pairs = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = pairs.find((part) => part.startsWith('t='))?.slice(2);
  const signature = pairs.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) {
    return false;
  }

  const expected = createHmac('sha256', webhookSecret).update(`${timestamp}.${payload}`, 'utf8').digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
};
