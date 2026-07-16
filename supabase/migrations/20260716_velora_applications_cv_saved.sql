-- ============================================================
-- VELORA · Etap 4 — CV kandydata, aplikacje o pracę, zapisane salony
-- Izolacja katalogu + RLS jak w 20260622_katalog_admin_and_paid_jobs.sql.
-- Zastosowano na projekcie dhuvykwecsxgchzxufxw.
-- ============================================================

-- 1) Profil kandydata / CV (edytowalny przez właściciela) -----------------
create table if not exists public.candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  headline text,
  bio text,
  experience_years int,
  skills text[] not null default '{}',
  phone text,
  city text,
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.candidate_profiles enable row level security;

drop policy if exists cp_self_all on public.candidate_profiles;
create policy cp_self_all on public.candidate_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists cp_admin on public.candidate_profiles;
create policy cp_admin on public.candidate_profiles
  for select to authenticated using (public.is_katalog_admin());

-- 2) Aplikacje o pracę (snapshot CV — właściciel czyta bez cross-user RLS) --
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  applicant_user_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text,
  applicant_email text,
  headline text,
  experience_years int,
  skills text[] not null default '{}',
  message text,
  stage text not null default 'sent',
  created_at timestamptz not null default now(),
  constraint job_applications_stage_check check (stage in ('sent','review','interview','offer','rejected')),
  constraint job_applications_unique unique (job_id, applicant_user_id)
);
alter table public.job_applications enable row level security;

drop policy if exists app_applicant_select on public.job_applications;
create policy app_applicant_select on public.job_applications
  for select to authenticated using (applicant_user_id = auth.uid());

drop policy if exists app_applicant_insert on public.job_applications;
create policy app_applicant_insert on public.job_applications
  for insert to authenticated with check (applicant_user_id = auth.uid());

drop policy if exists app_owner_select on public.job_applications;
create policy app_owner_select on public.job_applications
  for select to authenticated
  using (exists (select 1 from public.job_listings j where j.id = job_id and j.owner_id = auth.uid()));

drop policy if exists app_owner_update on public.job_applications;
create policy app_owner_update on public.job_applications
  for update to authenticated
  using (exists (select 1 from public.job_listings j where j.id = job_id and j.owner_id = auth.uid()))
  with check (exists (select 1 from public.job_listings j where j.id = job_id and j.owner_id = auth.uid()));

drop policy if exists app_admin on public.job_applications;
create policy app_admin on public.job_applications
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

-- 3) Zapisane salony -------------------------------------------------------
create table if not exists public.saved_salons (
  user_id uuid not null references auth.users(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, salon_id)
);
alter table public.saved_salons enable row level security;

drop policy if exists ss_self_all on public.saved_salons;
create policy ss_self_all on public.saved_salons
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists job_applications_job_idx on public.job_applications(job_id);
create index if not exists job_applications_user_idx on public.job_applications(applicant_user_id);
create index if not exists saved_salons_user_idx on public.saved_salons(user_id);
