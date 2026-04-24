import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { createStripeCheckoutSession, createStripeCustomer } from '@/lib/stripe';
import { isMissingColumnError } from '@/lib/profile';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { client, profile, claims } = await requireSession();

    if (profile.is_premium) {
      return ok({
        url: `${env.appUrl() || new URL(request.url).origin}/?payment=already-premium`
      });
    }

    const origin = env.appUrl() || new URL(request.url).origin;
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await createStripeCustomer({
        userId: profile.id,
        displayName: profile.full_name || profile.display_name,
        lineUserId: claims.line_user_id
      });
      customerId = customer.id;

      let updateResult = await client
        .from('user_profiles')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select('id')
        .single();

      if (updateResult.error && isMissingColumnError(updateResult.error, 'stripe_customer_id')) {
        updateResult = await client
          .from('user_profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id)
          .select('id')
          .single();
      }

      if (updateResult.error) throw updateResult.error;
    }

    const session = await createStripeCheckoutSession({
      customerId,
      userId: profile.id,
      successUrl: `${origin}/?payment=success&tab=problems`,
      cancelUrl: `${origin}/?payment=cancel&tab=problems`
    });

    if (!session.url) {
      throw new Error('Stripe Checkout URL の生成に失敗しました。');
    }

    return ok({
      url: session.url,
      customerId
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'プレミアム決済の開始に失敗しました。', 500);
  }
}
