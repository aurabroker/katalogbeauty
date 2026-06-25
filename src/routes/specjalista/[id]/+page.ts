import type { PageLoad } from './$types';
import { sb } from '$lib/supabase';
import { error } from '@sveltejs/kit';

/** Specjalista + salon macierzysty (minimalny profil §9.4 — dane z tabeli staff) */
export interface SpecialistProfile {
  id: string;
  name: string;
  role_label: string | null;
  bio: string | null;
  photo_url: string | null;
  salon_id: string;
  salon: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

export const load: PageLoad = async ({ params }) => {
  const { data, error: err } = await sb
    .from('staff')
    .select(
      'id,name,role_label,bio,photo_url,salon_id,salon:salons!inner(id,name,slug,city,phone,email,source,status)'
    )
    .eq('id', params.id)
    .eq('is_active', true)
    .eq('salon.source', 'katalog')
    .maybeSingle();

  if (err || !data) {
    error(404, 'Specjalista nie został znaleziony');
  }

  return { specialist: data as unknown as SpecialistProfile };
};
