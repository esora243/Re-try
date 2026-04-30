import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase';
import { env } from '@/lib/env';
import { getMockProfileById, upsertMockProfile } from '@/lib/mock-data';
import { getSessionFromCookies, SESSION_COOKIE, signSessionToken } from '@/lib/session';

const lineVerifySchema = z.object({
  lineUserId: z.string().min(1),
  displayName: z.string().min(1),
  pictureUrl: z.string().url().nullish(),
  idToken: z.string().min(10).nullish()
});

const avatarPalette = ['#1B2A4A', '#3B82F6', '#7C3AED', '#059669', '#EA580C', '#DC2626'];

export const verifyLinePayload = async (payload: unknown) => {
  const data = lineVerifySchema.parse(payload);
  const channelId = env.lineChannelId();

  if (data.idToken && channelId) {
    const body = new URLSearchParams({
      id_token: data.idToken,
      client_id: channelId
    });

    const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    if (!response.ok) {
      throw new Error('LINEのIDトークン検証に失敗しました。');
    }

    const verified = (await response.json()) as { sub?: string };
    if (verified.sub !== data.lineUserId) {
      throw new Error('LINE UID が一致しません。');
    }
  }

  return data;
};

export const upsertLineProfile = async (data: Awaited<ReturnType<typeof verifyLinePayload>>) => {
  if (!env.hasSupabaseAdminConfig()) {
    return upsertMockProfile(data.lineUserId, data.displayName, data.pictureUrl ?? null);
  }

  const admin = createAdminClient();
  const existing = await admin.from('user_profiles').select('*').eq('line_user_id', data.lineUserId).maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  const avatarColor = avatarPalette[data.lineUserId.length % avatarPalette.length];

  if (existing.data) {
    const update = await admin
      .from('user_profiles')
      .update({
        display_name: data.displayName,
        avatar_url: data.pictureUrl ?? null,
        avatar_color: existing.data.avatar_color ?? avatarColor,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.data.id)
      .select('*')
      .single();

    if (update.error) throw update.error;
    return update.data;
  }

  const insert = await admin
    .from('user_profiles')
    .insert({
      line_user_id: data.lineUserId,
      display_name: data.displayName,
      avatar_url: data.pictureUrl ?? null,
      avatar_color: avatarColor,
      onboarding_completed: false
    })
    .select('*')
    .single();

  if (insert.error) throw insert.error;
  return insert.data;
};

export const buildAuthResponse = (profile: {
  id: string;
  line_user_id: string;
  display_name: string;
  onboarding_completed?: boolean;
  is_admin?: boolean;
  is_premium?: boolean;
}) => {
  const token = signSessionToken({
    sub: profile.id,
    role: 'authenticated',
    aud: 'authenticated',
    line_user_id: profile.line_user_id,
    display_name: profile.display_name
  });

  const response = NextResponse.json({
    ok: true,
    userId: profile.id,
    needsOnboarding: !profile.onboarding_completed,
    isAdmin: Boolean(profile.is_admin),
    isPremium: Boolean(profile.is_premium)
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
};

export const clearSessionCookie = () => {
  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
};

export const getOptionalSession = async () => {
  const { token, claims } = getSessionFromCookies();
  if (!token || !claims) return null;

  if (!env.hasSupabaseAdminConfig()) {
    const profile = getMockProfileById(claims.sub, claims.display_name, claims.line_user_id);
    if (!profile) return null;
    return {
      token,
      claims,
      client: null,
      profile
    };
  }

  const client = createAdminClient();
  const profileResult = await client.from('user_profiles').select('*').eq('id', claims.sub).maybeSingle();
  if (profileResult.error || !profileResult.data) {
    return null;
  }

  return {
    token,
    claims,
    client,
    profile: profileResult.data
  };
};

export const requireSession = async () => {
  const session = await getOptionalSession();
  if (!session) {
    throw new Error('認証セッションがありません。LINEログインを実行してください。');
  }

  return session;
};
