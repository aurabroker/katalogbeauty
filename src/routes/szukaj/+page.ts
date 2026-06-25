import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import type { SalonWithRelations, ServiceCategory } from '$lib/database.types';

export const load: PageLoad = async () => {
  const [salonsRes, catsRes] = await Promise.all([
    sb
      .from('salons')
      .select(
        'id,name,slug,city,address_line,short_description,description,latitude,longitude,created_at,gallery_assets(public_url,is_cover,is_active),services(id,is_active,category_id,price_from)'
      )
      .eq('status', 'active')
      .eq('source', 'katalog')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false }),

    sb
      .from('service_categories')
      .select('id,name,slug,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order')
  ]);

  return {
    salons: (salonsRes.data ?? []) as unknown as SalonWithRelations[],
    categories: (catsRes.data ?? []) as ServiceCategory[],
    loadError: salonsRes.error?.message ?? ''
  };
};
