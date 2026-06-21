import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';

export const load: PageLoad = async () => {
  const { data, error } = await sb
    .from('job_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return {
    jobs: data ?? [],
    loadError: error?.message ?? ''
  };
};
