import { createAdminClient } from '@/lib/supabase';
import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { normalizeUserProfile } from '@/lib/profile';
import { buildProfileShadowMap, mergeUserProfileWithShadow, PROFILE_SHADOW_SUBJECT } from '@/lib/profile-shadow';

export async function GET() {
  try {
    const { profile } = await requireSession();
    if (!profile.is_admin) {
      return fail('管理者のみ閲覧できます。', 403);
    }

    const admin = createAdminClient();
    const [profilesResult, shadowsResult] = await Promise.all([
      admin.from('user_profiles').select('*').order('created_at', { ascending: false }),
      admin
        .from('study_logs')
        .select('user_id, memo, created_at, logged_on')
        .eq('subject', PROFILE_SHADOW_SUBJECT)
        .order('created_at', { ascending: false })
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (shadowsResult.error) throw shadowsResult.error;

    const shadowMap = buildProfileShadowMap(shadowsResult.data ?? []);
    const users = (profilesResult.data ?? [])
      .map((item) => mergeUserProfileWithShadow(item, shadowMap.get(item.id) ?? null) ?? normalizeUserProfile(item))
      .filter(Boolean);

    return ok(users);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '利用者データの取得に失敗しました。', 400);
  }
}
