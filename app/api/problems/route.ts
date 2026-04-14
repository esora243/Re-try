import { z } from 'zod';
import { createAnonClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/session';
import { fail, ok } from '@/lib/api';
import { requireSession } from '@/lib/auth';

const problemSchema = z.object({
  university_id: z.string().uuid().nullable().optional(),
  subject: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  difficulty: z.coerce.number().int().min(1).max(5),
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

    const { token } = getSessionFromCookies();
    const client = createAnonClient(token ?? undefined);

    const profileResult = token
      ? await client.from('user_profiles').select('id, is_premium').limit(1).single()
      : { data: null, error: null as null | Error };

    let query = client
      .from('problems')
      .select('*, university:universities(id, name, region)')
      .order('year', { ascending: false })
      .order('created_at', { ascending: false });

    if (subject && subject !== 'all') query = query.eq('subject', subject);
    if (year && year !== 'all') query = query.eq('year', Number(year));
    if (universityId && universityId !== 'all') query = query.eq('university_id', universityId);

    const problemsResult = await query;
    if (problemsResult.error) throw problemsResult.error;

    let progressRows: Array<{ problem_id: string; status: 'correct' | 'wrong' | 'bookmarked' }> = [];
    if (profileResult.data) {
      const progressResult = await client
        .from('problem_progress')
        .select('problem_id, status')
        .eq('user_id', profileResult.data.id);
      if (progressResult.error) throw progressResult.error;
      progressRows = progressResult.data;
    }

    const progress = Object.fromEntries(progressRows.map((row) => [row.problem_id, row.status]));
    const canViewPremium = profileResult.data?.is_premium ?? false;

    const problems = problemsResult.data.map((problem) => ({
      ...problem,
      can_view_answer: canViewPremium || !problem.is_premium,
      answer: canViewPremium || !problem.is_premium ? problem.answer : null,
      answer_detail: canViewPremium || !problem.is_premium ? problem.answer_detail : null
    }));

    return ok({
      problems,
      progress,
      profile: profileResult.data ?? null
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '過去問の取得に失敗しました。');
  }
}

export async function POST(request: Request) {
  try {
    const { client, profile } = await requireSession();
    if (!profile.is_admin) {
      return fail('管理者のみ追加できます。', 403);
    }

    const payload = problemSchema.parse(await request.json());
    const result = await client.from('problems').insert(payload).select('*').single();
    if (result.error) throw result.error;

    return ok(result.data, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '問題の追加に失敗しました。', 400);
  }
}
