import { clsx, type ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const formatDate = (value?: string | null, fallback = '未設定') => {
  if (!value) return fallback;
  try {
    return format(parseISO(value), 'yyyy/MM/dd', { locale: ja });
  } catch {
    return fallback;
  }
};

export const formatDateTime = (value?: string | null, fallback = '未設定') => {
  if (!value) return fallback;
  try {
    return format(parseISO(value), 'yyyy/MM/dd HH:mm', { locale: ja });
  } catch {
    return fallback;
  }
};

export const calculateStreak = (days: string[]) => {
  const uniqueDays = [...new Set(days)].sort((a, b) => b.localeCompare(a));
  if (uniqueDays.length === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const loggedDay of uniqueDays) {
    const compare = new Date(loggedDay);
    compare.setHours(0, 0, 0, 0);

    if (compare.getTime() === cursor.getTime()) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      const yesterday = new Date();
      yesterday.setHours(0, 0, 0, 0);
      yesterday.setDate(yesterday.getDate() - 1);
      if (compare.getTime() === yesterday.getTime()) {
        streak += 1;
        cursor.setTime(compare.getTime());
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    break;
  }

  return streak;
};
