import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { Database } from '$lib/database.types';

/*
 * Projekt Supabase: BEAUTY (dhuvykwecsxgchzxufxw) — katalog współdzieli bazę
 * z aplikacją rezerwacyjną. Klucz anon jest publiczny z założenia —
 * bezpieczeństwo opiera się na politykach RLS. Można nadpisać przez zmienne
 * środowiskowe PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY.
 */
const SUPABASE_URL = env.PUBLIC_SUPABASE_URL || 'https://dhuvykwecsxgchzxufxw.supabase.co';

const SUPABASE_ANON_KEY =
  env.PUBLIC_SUPABASE_ANON_KEY ||
  [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodXZ5a3dlY3N4Z2Noenh1Znh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzAwNzEsImV4cCI6MjA5MjYwNjA3MX0.',
    'ooJL1hFIN3Mjb22QEtI7ZFAfSyLM4aGwduGGMykaaHE'
  ].join('');

export const sb = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
