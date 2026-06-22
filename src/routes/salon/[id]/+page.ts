import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import type { SalonWithRelations } from '$lib/database.types';

export const load: PageLoad = async ({ params }) => {
  const { data, error: err } = await sb
    .from('salons')
    .select('*,gallery_assets(*),services(*)')
    .eq('id', params.id)
    .maybeSingle();

  if (err || !data) {
    error(404, 'Salon nie został znaleziony');
  }

  return { salon: data as unknown as SalonWithRelations };
};
