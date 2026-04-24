import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAdminClient, createAnonClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/session';
import { fail, ok } from '@/lib/api';
import { normalizeUserProfile } from '@/lib/profile';

const messageSchema = z.object({
  channel_id: z.string().uuid(),
  content: z.string().trim().min(1).max(500)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    if (!channelId) return fail('channelId が必要です。', 400);

    const client = createAnonClient();
    const channelResult = await client.from('community_channels').select('*').eq('id', channelId).single();
    if (channelResult.error) throw channelResult.error;

    if (channelResult.data.is_premium) {
      const { claims } = getSessionFromCookies();
      if (!claims?.sub) {
        return fail('プレミアムチャンネルの閲覧にはログインが必要です。', 401);
      }

      const admin = createAdminClient();
      const profileResult = await admin.from('user_profiles').select('*').eq('id', claims.sub).single();
      if (profileResult.error) throw profileResult.error;
      const profile = normalizeUserProfile(profileResult.data);
      if (!profile?.is_premium && !profile?.is_admin) {
        return fail('プレミアム会員のみ閲覧できます。', 403);
      }
    }

    const result = await client
      .from('community_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'メッセージ取得に失敗しました。');
  }
}

export async function POST(request: Request) {
  try {
    const { client, profile } = await requireSession();
    const payload = messageSchema.parse(await request.json());

    const channelResult = await client.from('community_channels').select('*').eq('id', payload.channel_id).single();
    if (channelResult.error) throw channelResult.error;

    if (channelResult.data.is_premium && !profile.is_premium && !profile.is_admin) {
      return fail('プレミアム会員のみ投稿できます。', 403);
    }

    const result = await client
      .from('community_messages')
      .insert({
        channel_id: payload.channel_id,
        user_id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        avatar_color: profile.avatar_color,
        content: payload.content,
        is_tutor: false
      })
      .select('*')
      .single();

    if (result.error) throw result.error;
    return ok(result.data, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'メッセージ送信に失敗しました。', 400);
  }
}
