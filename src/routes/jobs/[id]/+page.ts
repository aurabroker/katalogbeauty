import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import type { JobListing } from '$lib/database.types';

export const load: PageLoad = async ({ params, url }) => {
  // RLS (jobs_public_read) zwróci tylko ogłoszenia aktywne i nieprzeterminowane
  const { data, error: err } = await sb
    .from('job_listings')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (err || !data) {
    error(404, 'Ogłoszenie nie zostało znalezione lub wygasło');
  }

  return { job: data as JobListing, origin: url.origin };
};
