import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { upsertMockProgress } from '@/lib/mock-data';

const progressSchema = z.object({
  status: z.enum(['correct', 'wrong', 'bookmarked'])
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireSession();
    const payload = progressSchema.parse(await request.json());

    if (!env.hasSupabaseAdminConfig()) {
      return ok(upsertMockProgress(profile.id, params.id, payload.status));
    }

    const client = createAdminClient();
    const existing = await client
      .from('problem_progress')
      .select('id')
      .eq('user_id', profile.id)
      .eq('problem_id', params.id)
      .maybeSingle();

    if (existing.error) throw existing.error;

    const result = existing.data
      ? await client.from('problem_progress').update({ status: payload.status, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select('*').single()
      : await client.from('problem_progress').insert({ user_id: profile.id, problem_id: params.id, status: payload.status }).select('*').single();

    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '進捗の保存に失敗しました。', 400);
  }
}
