import { createAnonClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/session';
import { fail, ok } from '@/lib/api';

export async function GET() {
  try {
    const { token } = getSessionFromCookies();
    const client = createAnonClient(token ?? undefined);
    const result = await client.from('community_channels').select('*').order('sort_order');
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'チャンネル一覧の取得に失敗しました。');
  }
}
