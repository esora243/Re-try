import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { isProfileShadowSubject, PROFILE_SHADOW_SUBJECT } from '@/lib/profile-shadow';

const studyLogSchema = z.object({
  subject: z.string().min(1),
  minutes: z.coerce.number().int().min(1).max(1440),
  memo: z.string().max(500).nullable().optional(),
  logged_on: z.string().date()
});

export async function GET() {
  try {
    const { client, profile } = await requireSession();
    const result = await client
      .from('study_logs')
      .select('*')
      .eq('user_id', profile.id)
      .neq('subject', PROFILE_SHADOW_SUBJECT)
      .order('logged_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '学習記録の取得に失敗しました。', 401);
  }
}

export async function POST(request: Request) {
  try {
    const { client, profile } = await requireSession();
    const payload = studyLogSchema.parse(await request.json());

    if (isProfileShadowSubject(payload.subject)) {
      return fail('この科目名は予約済みです。別の科目名を入力してください。', 400);
    }

    const result = await client
      .from('study_logs')
      .insert({
        ...payload,
        user_id: profile.id
      })
      .select('*')
      .single();

    if (result.error) throw result.error;
    return ok(result.data, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '学習記録の保存に失敗しました。', 400);
  }
}
