import { ZodError } from 'zod';
import { buildAuthResponse, upsertLineProfile, verifyLinePayload } from '@/lib/auth';
import { fail } from '@/lib/api';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const verified = await verifyLinePayload(payload);
    const profile = await upsertLineProfile(verified);
    return buildAuthResponse(profile);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail('LINEログイン情報の形式が正しくありません。', 400);
    }

    const message = error instanceof Error ? error.message : 'LINEログインに失敗しました。';
    return fail(message, 500);
  }
}
