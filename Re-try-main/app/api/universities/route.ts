import { createPublicClient } from '@/lib/supabase';
import { fail, ok } from '@/lib/api';
import { env } from '@/lib/env';
import { mockUniversities } from '@/lib/mock-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const science = searchParams.get('science');
    const search = searchParams.get('search');
    if (!env.hasSupabaseConfig()) {
      const filtered = mockUniversities.filter((item) => {
        const regionMatch = !region || region === 'all' || item.region === region;
        const searchMatch = !search || item.name.includes(search);
        return regionMatch && searchMatch;
      });
      return ok(filtered);
    }

    const client = createPublicClient();

    let query = client.from('universities').select('*').order('name');
    if (region && region !== 'all') query = query.eq('region', region);
    if (search) query = query.ilike('name', `%${search}%`);
    if (science && science !== 'all') {
      const column = science === '理学系' ? 'physics_chem' : science === '統計・数学' ? 'stats_math' : null;
      if (column) query = query.not(column, 'is', null);
    }

    const result = await query;
    if (result.error) throw result.error;
    return ok(result.data ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : '大学情報の取得に失敗しました。', 500);
  }
}
