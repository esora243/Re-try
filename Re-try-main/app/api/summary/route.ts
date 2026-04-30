import { createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { getMockSummary } from '@/lib/mock-data';

export async function GET() {
  try {
    if (!env.hasSupabaseConfig()) {
      return ok(getMockSummary());
    }

    const client = createPublicClient();
    const [universities, problems, channels, messages] = await Promise.all([
      client.from('universities').select('*', { head: true, count: 'exact' }),
      client.from('problems').select('*', { head: true, count: 'exact' }),
      client.from('community_channels').select('*', { head: true, count: 'exact' }),
      client.from('community_messages').select('*', { head: true, count: 'exact' })
    ]);

    const firstError = [universities.error, problems.error, channels.error, messages.error].find(Boolean);
    if (firstError) throw firstError;

    return ok({
      universities: universities.count ?? 0,
      problems: problems.count ?? 0,
      channels: channels.count ?? 0,
      messages: messages.count ?? 0
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '集計取得に失敗しました。', 500);
  }
}
