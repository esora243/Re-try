import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAdminClient, createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';

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
    const result = await createPublicClient().from('universities').select('*').eq('id', params.id).single();
    if (result.error) throw result.error;
    return ok(result.data);
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
