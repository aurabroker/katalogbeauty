import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // SPA: dynamiczne dane z Supabase ładowane po stronie klienta,
    // więc fallback 200.html obsługuje wszystkie trasy (np. /salon/[id]).
    adapter: adapter({
      fallback: '200.html',
      precompress: false
    })
  }
};

export default config;
