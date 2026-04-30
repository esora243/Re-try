import { createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { mockSchedules } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    if (!env.hasSupabaseConfig()) {
      return ok(mockSchedules.filter((item) => !year || year === 'all' || item.year === Number(year)));
    }

    let query = createPublicClient()
      .from('exam_schedules')
      .select('*, university:universities(id, name, region)')
      .order('application_start', { ascending: true });

    if (year && year !== 'all') query = query.eq('year', Number(year));

    const result = await query;
    if (result.error) throw result.error;
    return ok(result.data ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '試験日程の取得に失敗しました。', 500);
  }
}
