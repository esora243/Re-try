import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

export async function GET() {
  try {
    const { profile, claims } = await requireSession();
    return ok({
      authenticated: true,
      profile,
      claims
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '未認証です。', 401);
  }
}
