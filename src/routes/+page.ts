import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import type { SalonWithRelations } from '$lib/database.types';

export const load: PageLoad = async () => {
  const { data, error } = await sb
    .from('salons')
    .select(
      'id,name,slug,city,address_line,short_description,description,latitude,longitude,gallery_assets(public_url,is_cover,is_active),services(id,is_active)'
    )
    .eq('status', 'active')
    .eq('source', 'katalog')
    .not('published_at', 'is', null)
    .order('created_at', { ascending: false });

  return {
    salons: (data ?? []) as unknown as SalonWithRelations[],
    loadError: error?.message ?? ''
  };
};
