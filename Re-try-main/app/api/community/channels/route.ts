import { createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { mockChannels } from '@/lib/mock-data';

export async function GET() {
  try {
    if (!env.hasSupabaseConfig()) {
      return ok(mockChannels);
    }

    const result = await createPublicClient().from('community_channels').select('*').order('sort_order');
    if (result.error) throw result.error;
    return ok(result.data ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'コミュニティチャンネルの取得に失敗しました。', 500);
  }
}
