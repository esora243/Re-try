import { createAdminClient } from '@/lib/supabase';
import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

export async function GET() {
  try {
    const { profile } = await requireSession();
    if (!profile.is_admin) {
      return fail('管理者のみ閲覧できます。', 403);
    }

    const admin = createAdminClient();
    const result = await admin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '利用者データの取得に失敗しました。', 400);
  }
}
