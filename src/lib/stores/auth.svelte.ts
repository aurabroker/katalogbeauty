import { browser } from '$app/environment';
import type { User } from '@supabase/supabase-js';
import { sb } from '$lib/supabase';

/* Globalny stan sesji użytkownika (runes). */
export const auth = $state<{ user: User | null; ready: boolean }>({
  user: null,
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
