import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import { error } from '@sveltejs/kit';
import type { SalonWithRelations, Staff, Review, ServiceCategory } from '$lib/database.types';

export const load: PageLoad = async ({ params }) => {
  const [salonRes, staffRes, reviewsRes, catsRes] = await Promise.all([
    sb.from('salons').select('*,gallery_assets(*),services(*)').eq('id', params.id).maybeSingle(),
    sb
      .from('staff')
      .select('id,name,role_label,photo_url,salon_id,sort_order')
      .eq('salon_id', params.id)
      .eq('is_active', true)
      .order('sort_order'),
    sb
      .from('reviews')
      .select('id,author_name,rating,content,is_featured,created_at')
      .eq('salon_id', params.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    sb.from('service_categories').select('id,name,slug,sort_order').order('sort_order')
  ]);

  if (salonRes.error || !salonRes.data) {
    error(404, 'Salon nie został znaleziony');
  }

  return {
    salon: salonRes.data as unknown as SalonWithRelations,
    team: (staffRes.data ?? []) as Pick<
      Staff,
      'id' | 'name' | 'role_label' | 'photo_url' | 'salon_id' | 'sort_order'
    >[],
    reviews: (reviewsRes.data ?? []) as Pick<
      Review,
      'id' | 'author_name' | 'rating' | 'content' | 'is_featured' | 'created_at'
    >[],
    categories: (catsRes.data ?? []) as Pick<ServiceCategory, 'id' | 'name' | 'slug' | 'sort_order'>[]
  };
};
