import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { Database } from '$lib/database.types';

/*
 * Klucz anon jest publiczny z założenia — bezpieczeństwo opiera się na
 * politykach RLS w Supabase. Można nadpisać przez zmienne środowiskowe
 * PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY (działa też w runtime na Vercel).
 */
const SUPABASE_URL = env.PUBLIC_SUPABASE_URL || 'https://kukvgsjrmrqtzhkszzum.supabase.co';

const SUPABASE_ANON_KEY =
  env.PUBLIC_SUPABASE_ANON_KEY ||
  [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.',
    'wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY'
  ].join('');

export const sb = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
