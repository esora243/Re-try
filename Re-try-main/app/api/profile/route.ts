import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { updateMockProfile } from '@/lib/mock-data';

const profileSchema = z.object({
  full_name: z.string().min(1),
  school_name: z.string().min(1),
  gender: z.enum(['男性', '女性', 'その他', '回答しない']),
  club_name: z.string().min(1)
});

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireSession();
    const payload = profileSchema.parse(await request.json());

    if (!env.hasSupabaseAdminConfig()) {
      const updated = updateMockProfile(profile.id, { ...payload, onboarding_completed: true });
      if (!updated) throw new Error('プロフィールの保存先が見つかりません。');
      return ok(updated);
    }

    const result = await createAdminClient()
      .from('user_profiles')
      .update({ ...payload, onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'プロフィール更新に失敗しました。', 400);
  }
}
