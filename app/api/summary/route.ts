import { createAnonClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/session';
import { fail, ok } from '@/lib/api';

export async function GET() {
  try {
    const { token } = getSessionFromCookies();
    const client = createAnonClient(token ?? undefined);

    const [universities, problems, channels, messages] = await Promise.all([
      client.from('universities').select('*', { count: 'exact', head: true }),
      client.from('problems').select('*', { count: 'exact', head: true }),
      client.from('community_channels').select('*', { count: 'exact', head: true }),
      client.from('community_messages').select('*', { count: 'exact', head: true })
    ]);

    for (const result of [universities, problems, channels, messages]) {
      if (result.error) throw result.error;
    }

    return ok({
      universities: universities.count ?? 0,
      problems: problems.count ?? 0,
      channels: channels.count ?? 0,
      messages: messages.count ?? 0
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '集計の取得に失敗しました。');
  }
}
