import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import type {
  SalonWithRelations,
  ServiceCategory,
  SpecialistWithSalon,
  JobListing
} from '$lib/database.types';

export const load: PageLoad = async () => {
  const [salonsRes, catsRes, specialistsRes, jobsRes] = await Promise.all([
    sb
      .from('salons')
      .select(
        'id,name,slug,city,address_line,short_description,description,latitude,longitude,gallery_assets(public_url,is_cover,is_active),services(id,is_active,category_id)'
      )
      .eq('status', 'active')
      .eq('source', 'katalog')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false }),

    sb
      .from('service_categories')
      .select('id,name,slug,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order'),

    // Specjaliści = zespół salonów katalogu (§9.1 — wyróżnik produktu)
    sb
      .from('staff')
      .select('id,name,role_label,photo_url,salon_id,salon:salons!inner(id,name,slug,city,source,status)')
      .eq('is_active', true)
      .eq('salon.source', 'katalog')
      .eq('salon.status', 'active')
      .order('sort_order')
      .limit(8),

    // Pasek „Pracuj w beauty" — 1–2 najnowsze aktywne oferty
    sb
      .from('job_listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(2)
  ]);

  return {
    salons: (salonsRes.data ?? []) as unknown as SalonWithRelations[],
    categories: (catsRes.data ?? []) as ServiceCategory[],
    specialists: (specialistsRes.data ?? []) as unknown as SpecialistWithSalon[],
    featuredJobs: (jobsRes.data ?? []) as JobListing[],
    loadError: salonsRes.error?.message ?? ''
  };
};
