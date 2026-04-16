import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { fail, ok } from '@/lib/api';

const progressSchema = z.object({
  status: z.enum(['correct', 'wrong', 'bookmarked'])
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { client, profile } = await requireSession();
    const payload = progressSchema.parse(await request.json());

    const result = await client
      .from('problem_progress')
      .upsert(
        {
          user_id: profile.id,
          problem_id: params.id,
          status: payload.status,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,problem_id'
        }
      )
      .select('*')
      .single();

    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '学習進捗の更新に失敗しました。', 400);
  }
}
