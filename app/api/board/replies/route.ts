import { z } from 'zod';
import { getOptionalSession, requireSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { env } from '@/lib/env';
import { fail, ok } from '@/lib/api';
import { createMockBoardReply, getMockBoardThread, listMockBoardReplies } from '@/lib/mock-data';

const replySchema = z.object({
  thread_id: z.string().min(1),
  content: z.string().min(1).max(1500)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    if (!threadId) return fail('threadId が必要です。', 400);

    const session = await getOptionalSession();
    const isPremium = Boolean(session?.profile.is_premium);

    if (!env.hasSupabaseConfig()) {
      const thread = getMockBoardThread(threadId);
      if (!thread) return fail('スレッドが見つかりません。', 404);
      if (thread.is_premium && !isPremium) return fail('プレミアム会員限定スレッドです。', 403);
      return ok(listMockBoardReplies(threadId));
    }

    const threadResult = await createPublicClient()
      .from('board_threads')
      .select('id, is_premium')
      .eq('id', threadId)
      .single();
    if (threadResult.error || !threadResult.data) return fail('スレッドが見つかりません。', 404);
    if (threadResult.data.is_premium && !isPremium) {
      return fail('プレミアム会員限定スレッドです。', 403);
    }

    const result = await createPublicClient()
      .from('board_replies')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (result.error) throw result.error;
    return ok(result.data ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '返信取得に失敗しました。', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSession();
    const payload = replySchema.parse(await request.json());

    if (!env.hasSupabaseAdminConfig()) {
      const thread = getMockBoardThread(payload.thread_id);
      if (!thread) return fail('スレッドが見つかりません。', 404);
      if (thread.is_premium && !profile.is_premium) {
        return fail('プレミアム会員限定スレッドです。', 403);
      }
      if (thread.is_closed) return fail('このスレッドは閉鎖済みです。', 403);
      const created = createMockBoardReply({
        thread_id: payload.thread_id,
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        content: payload.content,
        is_tutor: false
      });
      return ok(created);
    }

    const threadResult = await createPublicClient()
      .from('board_threads')
      .select('id, is_premium, is_closed')
      .eq('id', payload.thread_id)
      .single();
    if (threadResult.error || !threadResult.data) return fail('スレッドが見つかりません。', 404);
    if (threadResult.data.is_premium && !profile.is_premium) {
      return fail('プレミアム会員限定スレッドです。', 403);
    }
    if (threadResult.data.is_closed) return fail('このスレッドは閉鎖済みです。', 403);

    const admin = createAdminClient();
    const insert = await admin
      .from('board_replies')
      .insert({
        thread_id: payload.thread_id,
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        content: payload.content,
        is_tutor: false
      })
      .select('*')
      .single();
    if (insert.error) throw insert.error;

    await admin.rpc('increment_board_thread_reply', { p_thread_id: payload.thread_id }).then(() => null, () => null);

    return ok(insert.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '返信投稿に失敗しました。', 400);
  }
}
