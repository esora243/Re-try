import { getOptionalSession } from '@/lib/auth';
import { createPublicClient } from '@/lib/supabase';
import { env } from '@/lib/env';
import { fail, ok } from '@/lib/api';
import { getMockBoardThread } from '@/lib/mock-data';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getOptionalSession();
    const isPremium = Boolean(session?.profile.is_premium);

    if (!env.hasSupabaseConfig()) {
      const thread = getMockBoardThread(params.id);
      if (!thread) return fail('スレッドが見つかりません。', 404);
      if (thread.is_premium && !isPremium) {
        return fail('プレミアム会員限定スレッドです。', 403);
      }
      return ok(thread);
    }

    const result = await createPublicClient()
      .from('board_threads')
      .select('*')
      .eq('id', params.id)
      .single();
    if (result.error || !result.data) return fail('スレッドが見つかりません。', 404);
    if (result.data.is_premium && !isPremium) {
      return fail('プレミアム会員限定スレッドです。', 403);
    }
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'スレッド取得に失敗しました。', 500);
  }
}
