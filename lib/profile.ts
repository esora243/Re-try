import type { UserProfile } from '@/types/models';

type PartialProfile = Record<string, unknown>;

const asStringOrNull = (value: unknown) => (typeof value === 'string' ? value : null);
const asString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const asBoolean = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback);
const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const hasCompletedOnboarding = (profile: PartialProfile | null | undefined) => {
  if (!profile) return false;
  if (typeof profile.onboarding_completed === 'boolean') {
    return profile.onboarding_completed;
  }

  return Boolean(
    asStringOrNull(profile.full_name)?.trim() &&
      asStringOrNull(profile.school_name)?.trim() &&
      asStringOrNull(profile.club_name)?.trim() &&
      asStringOrNull(profile.gender)?.trim()
  );
};

export const normalizeUserProfile = (profile: PartialProfile | null | undefined): UserProfile | null => {
  if (!profile) return null;

  return {
    id: asString(profile.id),
    line_user_id: asString(profile.line_user_id),
    display_name: asString(profile.display_name),
    full_name: asStringOrNull(profile.full_name),
    school_name: asStringOrNull(profile.school_name),
    gender: ((asStringOrNull(profile.gender) as UserProfile['gender'] | null) ?? null),
    club_name: asStringOrNull(profile.club_name),
    onboarding_completed: hasCompletedOnboarding(profile),
    avatar_url: asStringOrNull(profile.avatar_url),
    avatar_color: asStringOrNull(profile.avatar_color),
    is_premium: asBoolean(profile.is_premium),
    is_admin: asBoolean(profile.is_admin),
    stripe_customer_id: asStringOrNull(profile.stripe_customer_id),
    free_views_used: asNumber(profile.free_views_used),
    created_at: asString(profile.created_at, new Date(0).toISOString()),
    updated_at: asString(profile.updated_at, new Date(0).toISOString())
  };
};

export const isMissingColumnError = (error: unknown, columnName?: string) => {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('column') && (!columnName || message.includes(columnName));
};
