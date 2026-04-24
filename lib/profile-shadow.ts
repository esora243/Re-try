import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeUserProfile } from '@/lib/profile';
import type { UserProfile } from '@/types/models';

export const PROFILE_SHADOW_SUBJECT = '__retry_profile_shadow__';

type ShadowPayload = Pick<UserProfile, 'full_name' | 'school_name' | 'gender' | 'club_name'>;

type ShadowRow = {
  user_id: string;
  memo: string | null;
  created_at?: string;
  logged_on?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export const isProfileShadowSubject = (subject: string | null | undefined) => subject === PROFILE_SHADOW_SUBJECT;

export const serializeProfileShadow = (payload: ShadowPayload) =>
  JSON.stringify({
    full_name: payload.full_name,
    school_name: payload.school_name,
    gender: payload.gender,
    club_name: payload.club_name,
    onboarding_completed: true
  });

export const parseProfileShadow = (memo: string | null | undefined): Partial<UserProfile> | null => {
  if (!memo) return null;

  try {
    const parsed = JSON.parse(memo);
    if (!isRecord(parsed)) return null;

    const full_name = isString(parsed.full_name) ? parsed.full_name : null;
    const school_name = isString(parsed.school_name) ? parsed.school_name : null;
    const gender = isString(parsed.gender) ? parsed.gender : null;
    const club_name = isString(parsed.club_name) ? parsed.club_name : null;

    if (!full_name && !school_name && !gender && !club_name) {
      return null;
    }

    return {
      full_name,
      school_name,
      gender: (gender as UserProfile['gender']) ?? null,
      club_name,
      onboarding_completed: true
    };
  } catch {
    return null;
  }
};

export const mergeUserProfileWithShadow = (profile: Record<string, unknown> | null | undefined, shadow: Partial<UserProfile> | null) => {
  if (!profile) return null;
  return normalizeUserProfile(shadow ? { ...profile, ...shadow } : profile);
};

export const fetchLatestProfileShadow = async (client: SupabaseClient, userId: string) => {
  const result = await client
    .from('study_logs')
    .select('user_id, memo, created_at, logged_on')
    .eq('user_id', userId)
    .eq('subject', PROFILE_SHADOW_SUBJECT)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<ShadowRow>();

  if (result.error) {
    throw result.error;
  }

  return parseProfileShadow(result.data?.memo);
};

export const saveProfileShadow = async (client: SupabaseClient, userId: string, payload: ShadowPayload) => {
  const result = await client
    .from('study_logs')
    .insert({
      user_id: userId,
      subject: PROFILE_SHADOW_SUBJECT,
      minutes: 1,
      memo: serializeProfileShadow(payload),
      logged_on: new Date().toISOString().slice(0, 10)
    })
    .select('user_id, memo, created_at, logged_on')
    .single<ShadowRow>();

  if (result.error) {
    throw result.error;
  }

  return parseProfileShadow(result.data.memo);
};

export const buildProfileShadowMap = (rows: ShadowRow[]) => {
  const map = new Map<string, Partial<UserProfile>>();
  for (const row of rows) {
    if (map.has(row.user_id)) continue;
    const shadow = parseProfileShadow(row.memo);
    if (shadow) {
      map.set(row.user_id, shadow);
    }
  }
  return map;
};
