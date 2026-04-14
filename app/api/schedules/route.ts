import { z } from 'zod';
import { createAnonClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/session';
import { fail, ok } from '@/lib/api';
import { requireSession } from '@/lib/auth';

const scheduleSchema = z.object({
  university_id: z.string().uuid(),
  year: z.coerce.number().int().min(2020).max(2100),
  application_start: z.string().date().nullable().optional(),
  application_end: z.string().date().nullable().optional(),
  first_exam_date: z.string().date().nullable().optional(),
  second_exam_date: z.string().date().nullable().optional(),
  memo: z.string().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const { token } = getSessionFromCookies();
    const client = createAnonClient(token ?? undefined);

    let query = client
      .from('exam_schedules')
      .select('*, university:universities(id, name, region)')
      .order('application_start', { ascending: true, nullsFirst: false });

    if (year) {
      query = query.eq('year', Number(year));
    }

    const result = await query;
    if (result.error) throw result.error;

    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '試験日程の取得に失敗しました。');
  }
}

export async function POST(request: Request) {
  try {
    const { client, profile } = await requireSession();
    if (!profile.is_admin) {
      return fail('管理者のみ追加できます。', 403);
    }

    const payload = scheduleSchema.parse(await request.json());
    const result = await client.from('exam_schedules').insert(payload).select('*').single();
    if (result.error) throw result.error;

    return ok(result.data, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '試験日程の追加に失敗しました。', 400);
  }
}
