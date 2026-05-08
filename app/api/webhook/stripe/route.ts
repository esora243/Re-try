import Stripe from 'stripe';
import { headers } from 'next/headers';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/api';
import { updateMockProfile } from '@/lib/mock-data';

export const runtime = 'nodejs';

const activatePremium = async (params: {
  userId?: string | null;
  customerId?: string | null;
  paymentId?: string | null;
}) => {
  const { userId, customerId, paymentId } = params;
  if (!userId && !customerId) return;

  const data = {
    isPremium: true,
    stripeCustomerId: customerId ?? undefined,
    stripePaymentId: paymentId ?? undefined,
    premiumActivatedAt: new Date()
  };

  if (userId) {
    updateMockProfile(userId, {
      is_premium: true,
      stripe_customer_id: customerId ?? null,
      premium_activated_at: new Date().toISOString()
    });
    try {
      await prisma.userProfile.update({ where: { id: userId }, data });
    } catch {
      // モックユーザー等は無視
    }
    return;
  }

  if (customerId) {
    try {
      await prisma.userProfile.update({ where: { stripeCustomerId: customerId }, data });
    } catch {
      // 該当ユーザーなしは無視
    }
  }
};

export async function POST(request: Request) {
  try {
    const stripeSecretKey = env.stripeSecretKey();
    const webhookSecret = env.stripeWebhookSecret();

    if (!stripeSecretKey || !webhookSecret) {
      return fail('Webhook の準備が整っていません。', 500);
    }

    const stripe = new Stripe(stripeSecretKey);
    const signature = headers().get('stripe-signature');
    if (!signature) return fail('署名ヘッダーが見つかりません。', 400);

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await activatePremium({
          userId: session.metadata?.userId ?? null,
          customerId: typeof session.customer === 'string' ? session.customer : null,
          paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null
        });
      }
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      await activatePremium({
        userId: session.metadata?.userId ?? null,
        customerId: typeof session.customer === 'string' ? session.customer : null,
        paymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null
      });
    }

    return ok({ received: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Webhook の処理に失敗しました。', 400);
  }
}
