import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { mergeUserProfileWithShadow, saveProfileShadow } from '@/lib/profile-shadow';

const onboardingSchema = z.object({
  full_name: z.string().trim().min(1, '名前を入力してください。'),
  school_name: z.string().trim().min(1, '学校名を入力してください。'),
  gender: z.enum(['男性', '女性', 'その他', '回答しない'], {
    errorMap: () => ({ message: '性別を選択してください。' })
  }),
  club_name: z.string().trim().min(1, '部活を入力してください。')
});

export async function PATCH(request: Request) {
  try {
    const { client, profile } = await requireSession();
    const payload = onboardingSchema.parse(await request.json());

    const updates = {
      ...payload,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    };

    const result = await client.from('user_profiles').update(updates).eq('id', profile.id).select('*').single();

    if (result.error) {
      const shadow = await saveProfileShadow(client, profile.id, payload);
      return ok(mergeUserProfileWithShadow(profile, shadow));
    }

    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'プロフィール登録に失敗しました。', 400);
  }
}
