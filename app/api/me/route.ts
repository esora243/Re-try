import { requireSession } from '@/lib/auth';
import { ok } from '@/lib/api';

export async function GET() {
  try {
    const { profile, claims } = await requireSession();
    return ok({
      authenticated: true,
      profile,
      claims
    });
  } catch {
    return ok({
      authenticated: false,
      profile: null,
      claims: null
    });
  }
}
