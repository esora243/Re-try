import { z } from 'zod';
import { requireSession } from '@/lib/auth';
import { createAnonClient } from '@/lib/supabase';
import { getSessionFromCookies } from '@/lib/session';
import { fail, ok } from '@/lib/api';

const universitySchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  life_sci: z.string().min(1),
  physics_chem: z.string().min(1),
  stats_math: z.string().min(1),
  note: z.string().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const science = searchParams.get('science');
    const search = searchParams.get('search');

    const { token } = getSessionFromCookies();
    const client = createAnonClient(token ?? undefined);

    let query = client.from('universities').select('*').order('name');

    if (region && region !== 'all') {
      query = query.eq('region', region);
    }

    if (science === 'top') {
      query = query.ilike('life_sci', '%◎%');
    } else if (science === 'mid') {
      query = query.or('life_sci.ilike.%◎%,life_sci.ilike.%○%');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,note.ilike.%${search}%`);
    }

    const result = await query;
    if (result.error) throw result.error;

    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '大学データの取得に失敗しました。');
  }
}

export async function POST(request: Request) {
  try {
    const { client, profile } = await requireSession();
    if (!profile.is_admin) {
      return fail('管理者のみ追加できます。', 403);
    }

    const payload = universitySchema.parse(await request.json());
    const result = await client.from('universities').insert(payload).select('*').single();
    if (result.error) throw result.error;

    return ok(result.data, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : '大学データの追加に失敗しました。', 400);
  }
}
