import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase';
import { env } from '@/lib/env';
import { getSessionFromCookies, SESSION_COOKIE, signSessionToken } from '@/lib/session';
import { hasCompletedOnboarding, isMissingColumnError, normalizeUserProfile } from '@/lib/profile';
import { fetchLatestProfileShadow, mergeUserProfileWithShadow } from '@/lib/profile-shadow';

const lineVerifySchema = z.object({
  lineUserId: z.string().min(1),
  displayName: z.string().min(1),
  pictureUrl: z.string().url().nullish(),
  idToken: z.string().min(10).nullish()
});

const avatarPalette = ['#1B2A4A', '#3B82F6', '#7C3AED', '#059669', '#EA580C', '#DC2626'];

export const verifyLinePayload = async (payload: unknown) => {
  const data = lineVerifySchema.parse(payload);
  const clientId = env.lineClientId();

  if (data.idToken && clientId) {
    const body = new URLSearchParams({
      id_token: data.idToken,
      client_id: clientId
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

const withProfileShadow = async (admin: ReturnType<typeof createAdminClient>, profile: Record<string, unknown>) => {
  const shadow = await fetchLatestProfileShadow(admin, String(profile.id));
  const normalized = mergeUserProfileWithShadow(profile, shadow) ?? normalizeUserProfile(profile);
  if (!normalized) {
    throw new Error('プロフィールの正規化に失敗しました。');
  }
  return normalized;
};

export const upsertLineProfile = async (data: Awaited<ReturnType<typeof verifyLinePayload>>) => {
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
    return withProfileShadow(admin, update.data);
  }

  const insertPayload = {
    line_user_id: data.lineUserId,
    display_name: data.displayName,
    avatar_url: data.pictureUrl ?? null,
    avatar_color: avatarColor,
    onboarding_completed: false
  };

  let insert = await admin.from('user_profiles').insert(insertPayload).select('*').single();

  if (insert.error && isMissingColumnError(insert.error, 'onboarding_completed')) {
    insert = await admin
      .from('user_profiles')
      .insert({
        line_user_id: data.lineUserId,
        display_name: data.displayName,
        avatar_url: data.pictureUrl ?? null,
        avatar_color: avatarColor
      })
      .select('*')
      .single();
  }

  if (insert.error) throw insert.error;
  return withProfileShadow(admin, insert.data);
};

export const buildAuthResponse = (profile: {
  id: string;
  line_user_id: string;
  display_name: string;
  onboarding_completed?: boolean;
  full_name?: string | null;
  school_name?: string | null;
  gender?: string | null;
  club_name?: string | null;
  is_admin?: boolean;
}) => {
  const normalized = normalizeUserProfile(profile);
  if (!normalized) {
    throw new Error('プロフィールの生成に失敗しました。');
  }

  const token = signSessionToken({
    sub: normalized.id,
    role: 'authenticated',
    aud: 'authenticated',
    line_user_id: normalized.line_user_id,
    display_name: normalized.display_name
  });

  const response = NextResponse.json({
    ok: true,
    userId: normalized.id,
    needsOnboarding: !hasCompletedOnboarding(normalized),
    isAdmin: normalized.is_admin
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

export const requireSession = async () => {
  const { token, claims } = getSessionFromCookies();
  if (!token || !claims) {
    throw new Error('認証セッションがありません。LINEログインを実行してください。');
  }

  const client = createAdminClient();
  const profileResult = await client.from('user_profiles').select('*').eq('id', claims.sub).single();
  if (profileResult.error || !profileResult.data) {
    throw new Error('プロフィールの取得に失敗しました。');
  }

  const profile = await withProfileShadow(client, profileResult.data);

  return {
    token,
    claims,
    client,
    profile
  };
};
