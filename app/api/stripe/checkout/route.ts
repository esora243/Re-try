import Stripe from 'stripe';
import { requireSession } from '@/lib/auth';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { fail, ok } from '@/lib/api';

export const runtime = 'nodejs';

const getBaseUrl = (request: Request) => env.appUrl() || new URL(request.url).origin;

export async function POST(request: Request) {
  try {
    const stripeSecretKey = env.stripeSecretKey();
    if (!stripeSecretKey) {
      return fail('お支払いの準備が整っていません。少し時間をおいて再度お試しください。', 500);
    }

    const { profile } = await requireSession();
    if (profile.is_premium) {
      return ok({
        url: `${getBaseUrl(request)}/?tab=dashboard`,
        alreadyPremium: true
      });
    }

    const stripe = new Stripe(stripeSecretKey);
    const paymentMethodTypes = ['card', 'paypay'] as any;

    let customerId = profile.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: profile.full_name || profile.display_name,
        metadata: {
          userId: profile.id,
          lineUserId: profile.line_user_id
        }
      });
      customerId = customer.id;
      try {
        await prisma.userProfile.update({
          where: { id: profile.id },
          data: { stripeCustomerId: customerId }
        });
      } catch {
        // モックユーザー等で DB 未登録の場合はスキップ
      }
    }

    const baseUrl = getBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      payment_method_types: paymentMethodTypes,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'ja',
      metadata: {
        userId: profile.id,
        purchaseType: 'lifetime'
      },
      payment_intent_data: {
        metadata: {
          userId: profile.id,
          purchaseType: 'lifetime'
        }
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'jpy',
            unit_amount: env.stripePremiumAmount(),
            product_data: {
              name: env.stripePremiumName(),
              description: env.stripePremiumDescription()
            }
          }
        }
      ],
      success_url: `${baseUrl}/?tab=problems&billing=success`,
      cancel_url: `${baseUrl}/?tab=problems&billing=cancel`
    });

    if (!session.url) {
      throw new Error('お支払いページの作成に失敗しました。少し時間をおいて再度お試しください。');
    }

    return ok({ url: session.url });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'お支払いの準備中に問題が発生しました。少し時間をおいて再度お試しください。', 400);
  }
}
