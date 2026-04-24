import { createAdminClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { verifyStripeWebhookSignature } from '@/lib/stripe';
import { isMissingColumnError } from '@/lib/profile';

export const runtime = 'nodejs';

type StripeEvent = {
  type: string;
  data?: {
    object?: {
      customer?: string | null;
      client_reference_id?: string | null;
      metadata?: {
        userId?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!verifyStripeWebhookSignature(payload, signature)) {
      return fail('Stripe webhook 署名の検証に失敗しました。', 400);
    }

    const event = JSON.parse(payload) as StripeEvent;
    const relevantEvents = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);

    if (relevantEvents.has(event.type)) {
      const session = event.data?.object;
      const userId = session?.client_reference_id || session?.metadata?.userId || null;
      const customerId = session?.customer ?? null;

      if (userId || customerId) {
        const admin = createAdminClient();
        const applyUpdate = async (updates: Record<string, string | boolean | null>) => {
          const query = admin.from('user_profiles').update(updates);
          const result = userId ? query.eq('id', userId) : query.eq('stripe_customer_id', customerId as string);
          return result.select('id').maybeSingle();
        };

        let updateResult = await applyUpdate({
          is_premium: true,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        });

        if (updateResult.error && isMissingColumnError(updateResult.error, 'stripe_customer_id')) {
          updateResult = await applyUpdate({
            is_premium: true,
            updated_at: new Date().toISOString()
          });
        }

        if (updateResult.error && isMissingColumnError(updateResult.error, 'is_premium')) {
          updateResult = await applyUpdate({
            updated_at: new Date().toISOString()
          });
        }

        if (updateResult.error) throw updateResult.error;
      }
    }

    return ok({ received: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Stripe webhook の処理に失敗しました。', 400);
  }
}
