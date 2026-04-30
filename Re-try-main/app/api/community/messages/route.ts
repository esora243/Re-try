import { z } from 'zod';
import { getOptionalSession, requireSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { addMockMessage, listMockMessages, mockChannels } from '@/lib/mock-data';

const messageSchema = z.object({
  channel_id: z.string().min(1),
  content: z.string().min(1).max(500)
});

const readChannel = async (channelId: string) => {
  if (!env.hasSupabaseConfig()) {
    const channel = mockChannels.find((item) => item.id === channelId);
    if (!channel) throw new Error('チャンネルが見つかりません。');
    return channel;
  }

  const result = await createPublicClient().from('community_channels').select('*').eq('id', channelId).single();
  if (result.error) throw result.error;
  return result.data;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    if (!channelId) return fail('channelId が必要です。', 400);
    const channel = await readChannel(channelId);
    const session = await getOptionalSession();

    if (!env.hasSupabaseConfig()) {
      if (channel.is_premium && !session?.profile.is_premium) {
        return fail('プレミアム会員限定チャンネルです。', 403);
      }
      return ok(listMockMessages(channelId));
    }
    if (channel.is_premium && !session?.profile.is_premium) {
      return fail('プレミアム会員限定チャンネルです。', 403);
    }
    const result = await createPublicClient()
      .from('community_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (result.error) throw result.error;
    return ok(result.data ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'メッセージ取得に失敗しました。', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSession();
    const payload = messageSchema.parse(await request.json());
    const channel = await readChannel(payload.channel_id);
    if (channel.is_premium && !profile.is_premium) {
      return fail('プレミアム会員限定チャンネルです。', 403);
    }
    if (!env.hasSupabaseAdminConfig()) {
      return ok(
        addMockMessage({
          channel_id: payload.channel_id,
          user_id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          avatar_color: profile.avatar_color,
          content: payload.content,
          is_tutor: false
        })
      );
    }

    const result = await createAdminClient()
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
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'メッセージ送信に失敗しました。', 400);
  }
}
