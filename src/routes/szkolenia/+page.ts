import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import type { Training } from '$lib/database.types';

export const load: PageLoad = async () => {
  const { data, error } = await sb
    .from('trainings')
    .select('*')
    .eq('status', 'active')
    .eq('source', 'katalog')
    .order('event_date', { ascending: true });

  return {
    trainings: (data ?? []) as Training[],
    loadError: error?.message ?? ''
  };
};
