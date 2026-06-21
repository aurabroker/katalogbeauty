import { browser } from '$app/environment';
import { sb } from '$lib/supabase';

/* Globalny stan sesji użytkownika (runes). */
export const auth = $state({
  /** @type {import('@supabase/supabase-js').User | null} */
  user: null,
  /** false dopóki nie sprawdzimy sesji przy starcie */
  ready: false
});

if (browser) {
  sb.auth.getSession().then(({ data: { session } }) => {
    auth.user = session?.user ?? null;
    auth.ready = true;
  });

  sb.auth.onAuthStateChange((_event, session) => {
    auth.user = session?.user ?? null;
    auth.ready = true;
  });
}
