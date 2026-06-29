import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /panel',
    'Disallow: /jobs/panel',
    '',
    `Sitemap: ${url.origin}/sitemap.xml`,
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
};
