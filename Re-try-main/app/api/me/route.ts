import { getOptionalSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getOptionalSession();
    if (!session) {
      return Response.json({ authenticated: false, profile: null, claims: null });
    }

    return Response.json({
      authenticated: true,
      profile: session.profile,
      claims: session.claims
    });
  } catch {
    return Response.json({ authenticated: false, profile: null, claims: null });
  }
}
