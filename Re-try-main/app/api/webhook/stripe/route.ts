import Stripe from 'stripe';
import { headers } from 'next/headers';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/api';
import { updateMockProfile } from '@/lib/mock-data';

export const runtime = 'nodejs';

const syncPremium = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

  if (!userId && !customerId) return;

  const data = {
    isPremium: true,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    premiumActivatedAt: new Date()
  };

  if (userId) {
    updateMockProfile(userId, {
      is_premium: true,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      premium_activated_at: new Date().toISOString()
    });
    try {
      await prisma.userProfile.update({
        where: { id: userId },
        data
      });
    } catch {
      // モックユーザーなど DB 未登録時は無視
    }
    return;
  }

  if (customerId) {
    try {
      await prisma.userProfile.update({
        where: { stripeCustomerId: customerId },
        data
      });
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
      return fail('Stripe Webhook の環境変数が未設定です。', 500);
    }

    const stripe = new Stripe(stripeSecretKey);
    const signature = headers().get('stripe-signature');
    if (!signature) {
      return fail('Stripe 署名ヘッダーがありません。', 400);
    }

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === 'paid') {
        await syncPremium(session);
      }
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      await syncPremium(session);
    }

    return ok({ received: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Stripe Webhook の処理に失敗しました。', 400);
  }
}
