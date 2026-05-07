import { z } from 'zod';
import { getOptionalSession, requireSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { createMockBoardThread, listMockBoardThreads } from '@/lib/mock-data';

const threadSchema = z.object({
  title: z.string().min(2).max(60),
  category: z.enum(['相談', '勉強法', '出願', '面接', '雑談']),
  body: z.string().min(2).max(2000),
  is_premium: z.boolean().optional().default(false)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as
      | '相談'
      | '勉強法'
      | '出願'
      | '面接'
      | '雑談'
      | 'all'
      | null;

    const session = await getOptionalSession();
    const includePremium = Boolean(session?.profile.is_premium);

    if (!env.hasSupabaseConfig()) {
      const data = listMockBoardThreads({
        category: category && category !== 'all' ? (category as any) : undefined,
        includePremium
      });
      return ok({ threads: data, isPremium: includePremium });
    }

    let query = createPublicClient()
      .from('board_threads')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (category && category !== 'all') query = query.eq('category', category);
    if (!includePremium) query = query.eq('is_premium', false);

    const result = await query;
    if (result.error) throw result.error;
    return ok({ threads: result.data ?? [], isPremium: includePremium });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'スレッド取得に失敗しました。', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSession();
    const payload = threadSchema.parse(await request.json());

    if (payload.is_premium && !profile.is_premium) {
      return fail('プレミアム会員のみが限定スレッドを作成できます。', 403);
    }

    if (!env.hasSupabaseAdminConfig()) {
      const created = createMockBoardThread({
        title: payload.title,
        category: payload.category,
        body: payload.body,
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        is_premium: payload.is_premium ?? false
      });
      return ok(created);
    }

    const result = await createAdminClient()
      .from('board_threads')
      .insert({
        title: payload.title,
        category: payload.category,
        body: payload.body,
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_color: profile.avatar_color,
        is_premium: payload.is_premium ?? false,
        is_pinned: false,
        is_closed: false,
        reply_count: 0
      })
      .select('*')
      .single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'スレッド作成に失敗しました。', 400);
  }
}
