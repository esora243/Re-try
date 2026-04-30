import { differenceInCalendarDays, format } from 'date-fns';
import type { StudyLog } from '@/types/models';

export const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const formatDate = (value?: string | null) => {
  if (!value) return '未設定';
  try {
    return format(new Date(value), 'yyyy/MM/dd');
  } catch {
    return value;
  }
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '未設定';
  try {
    return format(new Date(value), 'yyyy/MM/dd HH:mm');
  } catch {
    return value;
  }
};

export const calculateStreak = (logs: Pick<StudyLog, 'logged_on'>[]) => {
  if (!logs.length) return 0;
  const uniqueDays = [...new Set(logs.map((log) => log.logged_on))]
    .map((day) => new Date(day))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let cursor = new Date();
  for (const day of uniqueDays) {
    const diff = differenceInCalendarDays(cursor, day);
    if (diff === 0 || diff === 1) {
      streak += 1;
      cursor = day;
      continue;
    }
    if (streak === 0 && diff > 1) {
      cursor = day;
      streak = 1;
      continue;
    }
    break;
  }
  return streak;
};
