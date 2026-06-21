import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import type { SalonWithRelations } from '$lib/database.types';

export const load: PageLoad = async () => {
  const { data, error } = await sb
    .from('salons')
    .select(
      'id,name,slug,city,street,tagline,description,lat,lng,salon_photos(url,is_cover),salon_services(id)'
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return {
    salons: (data ?? []) as unknown as SalonWithRelations[],
    loadError: error?.message ?? ''
  };
};
