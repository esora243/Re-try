import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { addMockStudyLog } from '@/lib/mock-data';

const studyLogSchema = z.object({
  subject: z.string().min(1),
  minutes: z.number().int().min(1).max(1440),
  memo: z.string().optional().default(''),
  logged_on: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { profile } = await requireSession();
    const payload = studyLogSchema.parse(await request.json());

    if (!env.hasSupabaseAdminConfig()) {
      return ok(
        addMockStudyLog({
          user_id: profile.id,
          subject: payload.subject,
          minutes: payload.minutes,
          memo: payload.memo || null,
          logged_on: payload.logged_on
        })
      );
    }

    const result = await createAdminClient()
      .from('study_logs')
      .insert({
        user_id: profile.id,
        subject: payload.subject,
        minutes: payload.minutes,
        memo: payload.memo || null,
        logged_on: payload.logged_on
      })
      .select('*')
      .single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '学習ログの登録に失敗しました。', 400);
  }
}
