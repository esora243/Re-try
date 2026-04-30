import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';

const scheduleSchema = z.object({
  university_id: z.string().uuid(),
  year: z.number().int().min(2020).max(2100),
  application_start: z.string().nullable().optional(),
  application_end: z.string().nullable().optional(),
  first_exam_date: z.string().nullable().optional(),
  second_exam_date: z.string().nullable().optional(),
  memo: z.string().nullable().optional()
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await createPublicClient().from('exam_schedules').select('*, university:universities(id, name, region)').eq('id', params.id).single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '試験日程の取得に失敗しました。', 500);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { profile } = await requireSession();
    if (!profile.is_admin) return fail('管理者のみ更新できます。', 403);
    const payload = scheduleSchema.parse(await request.json());
    const result = await createAdminClient().from('exam_schedules').update(payload).eq('id', params.id).select('*').single();
    if (result.error) throw result.error;
    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '試験日程の更新に失敗しました。', 400);
  }
}
