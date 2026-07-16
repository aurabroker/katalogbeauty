import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { sb } from '$lib/supabase';
import type { Training } from '$lib/database.types';

export const load: PageLoad = async ({ params }) => {
  const { data } = await sb
    .from('trainings')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) throw error(404, 'Nie znaleziono szkolenia');
  return { training: data as Training };
};
