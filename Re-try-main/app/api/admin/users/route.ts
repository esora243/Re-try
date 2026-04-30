import { requireSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { getMockStore } from '@/lib/mock-data';

export async function GET() {
  try {
    const { profile } = await requireSession();
    if (!profile.is_admin) return fail('管理者のみ閲覧できます。', 403);

    if (!env.hasSupabaseAdminConfig()) {
      return ok(Object.values(getMockStore().profiles));
    }

    const result = await createAdminClient().from('user_profiles').select('*').order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return ok(result.data ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'ユーザー一覧の取得に失敗しました。', 500);
  }
}
