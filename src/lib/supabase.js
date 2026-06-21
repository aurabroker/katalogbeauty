import { createClient } from '@supabase/supabase-js';

/*
 * Klucz anon jest publiczny z założenia — bezpieczeństwo opiera się na
 * politykach RLS w Supabase. Można nadpisać przez zmienne środowiskowe
 * PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY (Vite, prefiks PUBLIC_).
 */
const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://kukvgsjrmrqtzhkszzum.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3Znc2pybXJxdHpoa3N6enVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MTI0NzYsImV4cCI6MjA4ODQ4ODQ3Nn0.',
    'wOB-4CJTcRksSUY7WD7CXEccTKNxPIVF8AT8hczS5zY'
  ].join('');

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
