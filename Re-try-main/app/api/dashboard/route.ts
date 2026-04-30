import { calculateStreak } from '@/lib/utils';
import { requireSession } from '@/lib/auth';
import { createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { listMockProgress, listMockStudyLogs, mockProblems } from '@/lib/mock-data';

export async function GET() {
  try {
    const { profile } = await requireSession();

    if (!env.hasSupabaseConfig()) {
      const logs = listMockStudyLogs(profile.id);
      const progress = listMockProgress(profile.id).map((item) => ({
        ...item,
        problem: mockProblems.find((problem) => problem.id === item.problem_id) ?? null
      }));

      const totalMinutes = logs.reduce((sum, item) => sum + Number(item.minutes ?? 0), 0);
      const correctCount = progress.filter((item) => item.status === 'correct').length;
      const wrongCount = progress.filter((item) => item.status === 'wrong').length;
      const attempted = correctCount + wrongCount;
      const accuracy = attempted ? Math.round((correctCount / attempted) * 100) : 0;
      const streakDays = calculateStreak(logs);
      const subjectMap = new Map<string, { subject: string; minutes: number; attempted: number; correct: number; accuracy: number }>();
      for (const log of logs) {
        const current = subjectMap.get(log.subject) ?? { subject: log.subject, minutes: 0, attempted: 0, correct: 0, accuracy: 0 };
        current.minutes += Number(log.minutes ?? 0);
        subjectMap.set(log.subject, current);
      }
      for (const item of progress) {
        const subject = item.problem?.subject ?? 'その他';
        const current = subjectMap.get(subject) ?? { subject, minutes: 0, attempted: 0, correct: 0, accuracy: 0 };
        if (item.status === 'correct' || item.status === 'wrong') {
          current.attempted += 1;
          if (item.status === 'correct') current.correct += 1;
          current.accuracy = current.attempted ? Math.round((current.correct / current.attempted) * 100) : 0;
        }
        subjectMap.set(subject, current);
      }

      return ok({
        stats: {
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          correctCount,
          wrongCount,
          accuracy,
          streakDays
        },
        subjectBreakdown: [...subjectMap.values()].sort((a, b) => b.minutes - a.minutes),
        weakProblems: progress.filter((item) => item.status === 'wrong').slice(0, 6).map((item) => item.problem).filter(Boolean),
        studyLogs: logs.slice(0, 10)
      });
    }

    const client = createPublicClient();

    const [logsResult, progressResult] = await Promise.all([
      client.from('study_logs').select('*').eq('user_id', profile.id).order('logged_on', { ascending: false }),
      client.from('problem_progress').select('*, problem:problems(*, university:universities(id, name, region))').eq('user_id', profile.id).order('updated_at', { ascending: false })
    ]);

    if (logsResult.error) throw logsResult.error;
    if (progressResult.error) throw progressResult.error;

    const logs = logsResult.data ?? [];
    const progress = progressResult.data ?? [];
    const totalMinutes = logs.reduce((sum, item) => sum + Number(item.minutes ?? 0), 0);
    const correctCount = progress.filter((item) => item.status === 'correct').length;
    const wrongCount = progress.filter((item) => item.status === 'wrong').length;
    const attempted = correctCount + wrongCount;
    const accuracy = attempted ? Math.round((correctCount / attempted) * 100) : 0;
    const streakDays = calculateStreak(logs);

    const subjectMap = new Map<string, { subject: string; minutes: number; attempted: number; correct: number; accuracy: number }>();
    for (const log of logs) {
      const current = subjectMap.get(log.subject) ?? { subject: log.subject, minutes: 0, attempted: 0, correct: 0, accuracy: 0 };
      current.minutes += Number(log.minutes ?? 0);
      subjectMap.set(log.subject, current);
    }
    for (const item of progress) {
      const subject = item.problem?.subject ?? 'その他';
      const current = subjectMap.get(subject) ?? { subject, minutes: 0, attempted: 0, correct: 0, accuracy: 0 };
      if (item.status === 'correct' || item.status === 'wrong') {
        current.attempted += 1;
        if (item.status === 'correct') current.correct += 1;
        current.accuracy = current.attempted ? Math.round((current.correct / current.attempted) * 100) : 0;
      }
      subjectMap.set(subject, current);
    }

    const weakProblems = progress.filter((item) => item.status === 'wrong').slice(0, 6).map((item) => item.problem).filter(Boolean);

    return ok({
      stats: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        correctCount,
        wrongCount,
        accuracy,
        streakDays
      },
      subjectBreakdown: [...subjectMap.values()].sort((a, b) => b.minutes - a.minutes),
      weakProblems,
      studyLogs: logs.slice(0, 10)
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'ダッシュボードの取得に失敗しました。', 500);
  }
}
