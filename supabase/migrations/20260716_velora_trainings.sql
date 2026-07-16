-- ============================================================
-- VELORA · Filar Szkolenia (Etap 3)
-- trainings (szkolenia) + training_enrollments (zapisy).
--
-- UWAGA: baza Supabase jest współdzielona z innymi aplikacjami.
-- Tabele są izolowane katalogiem (source='katalog') i RLS bazuje na
-- funkcji public.is_katalog_admin() (patrz 20260622_katalog_admin_and_paid_jobs.sql).
-- Płatności w MVP są makietą (enrollment tworzony jako payment_status='paid').
-- ============================================================

create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  category text,
  description text,
  format text not null default 'stacjonarnie',   -- stacjonarnie | online | online_praktyka
  city text,
  event_date date,
  price_pln numeric not null default 0,
  seats_total int,
  seats_taken int not null default 0,
  cover_url text,
  is_certified boolean not null default true,
  status text not null default 'active',          -- active | draft | archived
  source text not null default 'katalog',
  created_at timestamptz not null default now()
);
alter table public.trainings enable row level security;

drop policy if exists trainings_public_read on public.trainings;
create policy trainings_public_read on public.trainings
  for select to anon, authenticated
  using (status = 'active' and source = 'katalog');

drop policy if exists katalog_admin_trainings on public.trainings;
create policy katalog_admin_trainings on public.trainings
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

create table if not exists public.training_enrollments (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  buyer_name text,
  buyer_email text,
  payment_method text not null default 'card',    -- card | blik | p24
  payment_status text not null default 'paid',    -- pending | paid (MVP: makieta = paid)
  amount_pln numeric not null default 0,
  status text not null default 'enrolled',        -- enrolled | cancelled
  created_at timestamptz not null default now(),
  constraint training_enrollments_method_check check (payment_method in ('card','blik','p24')),
  constraint training_enrollments_pay_check check (payment_status in ('pending','paid'))
);
alter table public.training_enrollments enable row level security;

drop policy if exists enroll_select_self on public.training_enrollments;
create policy enroll_select_self on public.training_enrollments
  for select to authenticated using (user_id = auth.uid());

drop policy if exists enroll_insert_self on public.training_enrollments;
create policy enroll_insert_self on public.training_enrollments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists katalog_admin_enrollments on public.training_enrollments;
create policy katalog_admin_enrollments on public.training_enrollments
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

create index if not exists trainings_status_idx on public.trainings(status, source);
create index if not exists enroll_user_idx on public.training_enrollments(user_id);
create index if not exists enroll_training_idx on public.training_enrollments(training_id);

-- ---- Seed: szkolenia demonstracyjne (placeholdery — do podmiany/usunięcia) ----
insert into public.trainings (slug, title, category, description, format, city, event_date, price_pln, seats_total, seats_taken, is_certified, status, source) values
('mezoterapia-iglowa-podstawy', 'Mezoterapia igłowa — kurs podstawowy', 'Kosmetologia', 'Teoria i praktyka mezoterapii igłowej: kwalifikacja klienta, dobór preparatów, techniki iniekcji, bezpieczeństwo i higiena. Certyfikat po ukończeniu.', 'stacjonarnie', 'Warszawa', '2026-09-12', 1290, 12, 6, true, 'active', 'katalog'),
('koloryzacja-balayage-2', 'Koloryzacja i balayage — poziom II', 'Fryzjerstwo', 'Zaawansowane techniki koloryzacji: balayage, airtouch, korekta koloru i pielęgnacja włosów po zabiegu. Praca na modelkach.', 'stacjonarnie', 'Kraków', '2026-09-28', 890, 10, 6, true, 'active', 'katalog'),
('stylizacja-rzes-3d-6d', 'Stylizacja rzęs — metody objętościowe 3D–6D', 'Stylizacja rzęs', 'Objętościowe metody aplikacji rzęs 3D–6D: dobór kształtu, tworzenie kompozycji, trwałość i bezpieczeństwo pracy.', 'online_praktyka', 'Wrocław', '2026-10-05', 690, 12, 4, true, 'active', 'katalog'),
('makijaz-slubny', 'Makijaż ślubny i okolicznościowy', 'Makijaż', 'Kompletny warsztat makijażu ślubnego: analiza kolorystyczna, techniki długotrwałe, próbne i finalne makijaże, obsługa klientki.', 'stacjonarnie', 'Poznań', '2026-10-19', 1090, 10, 5, true, 'active', 'katalog'),
('manicure-hybrydowy-podstawy', 'Manicure hybrydowy — podstawy', 'Paznokcie', 'Podstawy manicure hybrydowego: przygotowanie płytki, aplikacja, zdobienia i bezpieczne usuwanie. Zestaw startowy w cenie.', 'stacjonarnie', 'Gdańsk', '2026-09-20', 590, 12, 8, true, 'active', 'katalog'),
('barbering-fundamenty', 'Barbering — fundamenty strzyżenia', 'Barber', 'Fundamenty barberingu: techniki maszynką i nożyczkami, fade, konturowanie i pielęgnacja zarostu. Praca na modelach.', 'stacjonarnie', 'Łódź', '2026-11-08', 990, 10, 3, true, 'active', 'katalog')
on conflict (slug) do nothing;
