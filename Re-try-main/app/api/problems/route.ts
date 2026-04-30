import { z } from 'zod';
import { getOptionalSession, requireSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { mockProblems } from '@/lib/mock-data';

const problemSchema = z.object({
  university_id: z.string().uuid().nullable().optional(),
  subject: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  difficulty: z.number().int().min(1).max(5),
  question: z.string().min(1),
  options: z.string().nullable().optional(),
  answer: z.string().nullable().optional(),
  answer_detail: z.string().nullable().optional(),
  is_premium: z.boolean().default(true)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const year = searchParams.get('year');
    const universityId = searchParams.get('universityId');

    if (!env.hasSupabaseConfig()) {
      const filtered = mockProblems.filter((problem) => {
        const subjectMatch = !subject || subject === 'all' || problem.subject === subject;
        const yearMatch = !year || year === 'all' || String(problem.year) === year;
        const universityMatch = !universityId || universityId === 'all' || problem.university_id === universityId;
        return subjectMatch && yearMatch && universityMatch;
      });
      return ok({
        problems: filtered.map((problem) => ({
          ...problem,
          answer: problem.is_premium ? null : problem.answer,
          answer_detail: problem.is_premium ? null : problem.answer_detail,
          can_view_answer: !problem.is_premium
        })),
        progress: {},
        profile: null
      });
    }

    let query = createPublicClient()
      .from('problems')
      .select('*, university:universities(id, name, region)')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (subject && subject !== 'all') query = query.eq('subject', subject);
    if (year && year !== 'all') query = query.eq('year', Number(year));
    if (universityId && universityId !== 'all') query = query.eq('university_id', universityId);

    const result = await query;
    if (result.error) throw result.error;

    const session = await getOptionalSession();
    const canViewPremium = Boolean(session?.profile.is_premium);
    let progress: Record<string, 'correct' | 'wrong' | 'bookmarked'> = {};

    if (session?.profile.id && result.data?.length) {
      const progressResult = await createPublicClient()
        .from('problem_progress')
        .select('problem_id, status')
        .eq('user_id', session.profile.id)
        .in('problem_id', result.data.map((item) => item.id));
      if (progressResult.error) throw progressResult.error;
      progress = Object.fromEntries((progressResult.data ?? []).map((item) => [item.problem_id, item.status]));
    }

    const problems = (result.data ?? []).map((problem) => ({
      ...problem,
      answer: !problem.is_premium || canViewPremium ? problem.answer : null,
      answer_detail: !problem.is_premium || canViewPremium ? problem.answer_detail : null,
      can_view_answer: !problem.is_premium || canViewPremium
    }));

    return ok({
      problems,
      progress,
      profile: session ? { id: session.profile.id, is_premium: session.profile.is_premium } : null
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '問題一覧の取得に失敗しました。', 500);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireSession();
    if (!profile.is_admin) return fail('管理者のみ登録できます。', 403);
    const payload = problemSchema.parse(await request.json());
    const result = await createAdminClient().from('problems').insert(payload).select('*').single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '問題の登録に失敗しました。', 400);
  }
}
