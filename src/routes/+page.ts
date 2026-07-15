import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import type { SalonWithRelations, JobListing } from '$lib/database.types';

export const load: PageLoad = async () => {
  const [salonsRes, jobsRes] = await Promise.all([
    // Wyróżnione salony — 6 najnowszych aktywnych salonów katalogu
    sb
      .from('salons')
      .select(
        'id,name,slug,city,address_line,short_description,description,gallery_assets(public_url,is_cover,is_active),services(id,is_active,category_id)'
      )
      .eq('status', 'active')
      .eq('source', 'katalog')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),

    // Popularne oferty pracy — do 5 najnowszych aktywnych ogłoszeń
    sb
      .from('job_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  return {
    salons: (salonsRes.data ?? []) as unknown as SalonWithRelations[],
    featuredJobs: (jobsRes.data ?? []) as JobListing[],
    loadError: salonsRes.error?.message ?? ''
  };
};
