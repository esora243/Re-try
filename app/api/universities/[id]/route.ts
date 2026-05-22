import { z } from 'zod';
import { requireSession, getOptionalSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { mockUniversities, mockProblems } from '@/lib/mock-data';

const universitySchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  life_sci: z.string().min(1),
  physics_chem: z.string().min(1),
  stats_math: z.string().min(1),
  note: z.string().nullable().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    if (!env.hasSupabaseConfig()) {
      const university = mockUniversities.find((item) => item.id === params.id);
      if (!university) return fail('大学が見つかりませんでした。', 404);
      const problems = mockProblems
        .filter((problem) => problem.university_id === university.id)
        .map((problem) => ({
          ...problem,
          question: problem.is_premium ? null : problem.question,
          options: problem.is_premium ? null : problem.options,
          answer: problem.is_premium ? null : problem.answer,
          answer_detail: problem.is_premium ? null : problem.answer_detail,
          can_view_question: !problem.is_premium,
          can_view_answer: !problem.is_premium
        }));
      return ok({ university, problems });
    }

    const result = await createPublicClient().from('universities').select('*').eq('id', params.id).single();
    if (result.error) throw result.error;

    const session = await getOptionalSession();
    const canViewPremium = Boolean(session?.profile.is_premium);

    const problemsResult = await createPublicClient()
      .from('problems')
      .select('*')
      .eq('university_id', params.id)
      .order('year', { ascending: false });
    if (problemsResult.error) throw problemsResult.error;

    const problems = (problemsResult.data ?? []).map((problem) => {
      const unlocked = !problem.is_premium || canViewPremium;
      return {
        ...problem,
        question: unlocked ? problem.question : null,
        options: unlocked ? problem.options : null,
        answer: unlocked ? problem.answer : null,
        answer_detail: unlocked ? problem.answer_detail : null,
        can_view_question: unlocked,
        can_view_answer: unlocked
      };
    });

    return ok({ university: result.data, problems });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '大学情報の取得に失敗しました。', 500);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireSession();
    if (!profile.is_admin) return fail('管理者のみ更新できます。', 403);
    const payload = universitySchema.parse(await request.json());
    const result = await createAdminClient().from('universities').update(payload).eq('id', params.id).select('*').single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '大学情報の更新に失敗しました。', 400);
  }
}
