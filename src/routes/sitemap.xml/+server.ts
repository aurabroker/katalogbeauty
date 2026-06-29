import { sb } from '$lib/supabase';
import type { RequestHandler } from './$types';

// Mapa strony: strony statyczne + aktywne salony, specjaliści i ogłoszenia.
export const GET: RequestHandler = async ({ url }) => {
  const origin = url.origin;

  const [salonsRes, jobsRes, staffRes] = await Promise.all([
    sb
      .from('salons')
      .select('id,updated_at')
      .eq('status', 'active')
      .eq('source', 'katalog')
      .not('published_at', 'is', null),
    sb.from('job_listings').select('id,created_at').eq('status', 'active'),
    sb
      .from('staff')
      .select('id,updated_at,salon:salons!inner(source,status)')
      .eq('is_active', true)
      .eq('salon.source', 'katalog')
      .eq('salon.status', 'active')
  ]);

  const staticPaths = [
    { loc: '/', priority: '1.0', freq: 'daily' },
    { loc: '/jobs', priority: '0.9', freq: 'daily' },
    { loc: '/szukaj', priority: '0.8', freq: 'daily' },
    { loc: '/regulamin', priority: '0.3', freq: 'yearly' },
    { loc: '/polityka-prywatnosci', priority: '0.3', freq: 'yearly' }
  ];

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const entry = (loc: string, lastmod?: string | null, priority = '0.6', freq = 'weekly') =>
    `<url><loc>${esc(origin + loc)}</loc>` +
    (lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '') +
    `<changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;

  const parts: string[] = [];
  for (const p of staticPaths) parts.push(entry(p.loc, null, p.priority, p.freq));
  for (const s of salonsRes.data ?? []) parts.push(entry(`/salon/${s.id}`, s.updated_at, '0.8'));
  for (const j of jobsRes.data ?? []) parts.push(entry(`/jobs/${j.id}`, j.created_at, '0.7', 'daily'));
  for (const t of staffRes.data ?? []) parts.push(entry(`/specjalista/${t.id}`, t.updated_at, '0.6'));

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${parts.join('')}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
