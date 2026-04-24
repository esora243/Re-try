import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';
import { calculateStreak } from '@/lib/utils';
import { PROFILE_SHADOW_SUBJECT } from '@/lib/profile-shadow';

export async function GET() {
  try {
    const { client, profile } = await requireSession();

    const [logsResult, progressResult, problemsResult] = await Promise.all([
      client.from('study_logs').select('*').eq('user_id', profile.id).neq('subject', PROFILE_SHADOW_SUBJECT).order('logged_on', { ascending: false }),
      client.from('problem_progress').select('problem_id, status').eq('user_id', profile.id),
      client.from('problems').select('*, university:universities(id, name, region)').order('year', { ascending: false })
    ]);

    for (const result of [logsResult, progressResult, problemsResult]) {
      if (result.error) throw result.error;
    }

    const logs = logsResult.data ?? [];
    const progressRows = progressResult.data ?? [];
    const problems = problemsResult.data ?? [];
    const problemMap = new Map(problems.map((problem) => [problem.id, problem]));

    const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);
    const correctCount = progressRows.filter((row) => row.status === 'correct').length;
    const wrongCount = progressRows.filter((row) => row.status === 'wrong').length;
    const accuracy = correctCount + wrongCount === 0 ? 0 : Math.round((correctCount / (correctCount + wrongCount)) * 100);
    const streakDays = calculateStreak(logs.map((log) => log.logged_on));

    const subjectMap = new Map<string, { minutes: number; attempted: number; correct: number }>();

    for (const log of logs) {
      const current = subjectMap.get(log.subject) ?? { minutes: 0, attempted: 0, correct: 0 };
      current.minutes += log.minutes;
      subjectMap.set(log.subject, current);
    }

    for (const row of progressRows) {
      const problem = problemMap.get(row.problem_id);
      if (!problem) continue;
      const current = subjectMap.get(problem.subject) ?? { minutes: 0, attempted: 0, correct: 0 };
      current.attempted += 1;
      if (row.status === 'correct') current.correct += 1;
      subjectMap.set(problem.subject, current);
    }

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      minutes: data.minutes,
      attempted: data.attempted,
      correct: data.correct,
      accuracy: data.attempted === 0 ? 0 : Math.round((data.correct / data.attempted) * 100)
    }));

    const weakProblems = progressRows
      .filter((row) => row.status === 'wrong')
      .map((row) => problemMap.get(row.problem_id))
      .filter((problem): problem is NonNullable<typeof problem> => Boolean(problem))
      .slice(0, 6);

    return ok({
      stats: {
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        correctCount,
        wrongCount,
        accuracy,
        streakDays
      },
      subjectBreakdown,
      weakProblems,
      studyLogs: logs.slice(0, 10)
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'ダッシュボードデータの取得に失敗しました。', 401);
  }
}
