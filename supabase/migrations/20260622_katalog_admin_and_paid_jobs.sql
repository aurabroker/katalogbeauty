-- ============================================================
-- Admin katalogu (izolowany od globalnego is_admin / profiles.rola)
-- + płatne ogłoszenia o pracę (MVP: ręczna aktywacja przez admina)
--
-- UWAGA: baza Supabase jest współdzielona z innymi aplikacjami.
-- Wszystkie obiekty są nazwane `katalog_*` i dotyczą wyłącznie tabel
-- katalogu: salons, salon_services, salon_photos, job_listings,
-- katalog_profiles. Zastosowano już na projekcie kukvgsjrmrqtzhkszzum.
-- ============================================================

-- 1. Tabela adminów katalogu --------------------------------------------
create table if not exists public.katalog_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.katalog_admins enable row level security;

drop policy if exists katalog_admins_self_select on public.katalog_admins;
create policy katalog_admins_self_select on public.katalog_admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_katalog_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.katalog_admins where user_id = auth.uid());
$$;
grant execute on function public.is_katalog_admin() to anon, authenticated;

-- 2. Pola płatności / wygasania dla ogłoszeń ----------------------------
alter table public.job_listings
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists price_pln numeric,
  add column if not exists expires_at timestamptz;

alter table public.job_listings drop constraint if exists job_listings_payment_status_check;
alter table public.job_listings add constraint job_listings_payment_status_check
  check (payment_status in ('unpaid','paid'));

-- grandfathering: istniejące aktywne ogłoszenia = opłacone (0 zł), by nie zniknęły
update public.job_listings
  set payment_status = 'paid', paid_at = coalesce(paid_at, now()), price_pln = coalesce(price_pln, 0)
  where status = 'active' and payment_status = 'unpaid';

-- 3. Paywall właściciela: status=active dozwolony tylko gdy opłacone -----
drop policy if exists jobs_owner_all on public.job_listings;

create policy jobs_owner_select on public.job_listings
  for select to authenticated using (auth.uid() = owner_id);

create policy jobs_owner_insert on public.job_listings
  for insert to authenticated
  with check (auth.uid() = owner_id and (status <> 'active' or payment_status = 'paid'));

create policy jobs_owner_update on public.job_listings
  for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and (status <> 'active' or payment_status = 'paid'));

create policy jobs_owner_delete on public.job_listings
  for delete to authenticated using (auth.uid() = owner_id);

-- 4. Publiczny odczyt: aktywne i nieprzeterminowane ---------------------
drop policy if exists jobs_public_read on public.job_listings;
create policy jobs_public_read on public.job_listings
  for select to anon, authenticated
  using (status = 'active' and (expires_at is null or expires_at > now()));

-- 5. Pełny dostęp admina katalogu do tabel katalogu ---------------------
drop policy if exists katalog_admin_jobs on public.job_listings;
create policy katalog_admin_jobs on public.job_listings
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

drop policy if exists katalog_admin_salons on public.salons;
create policy katalog_admin_salons on public.salons
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

drop policy if exists katalog_admin_services on public.salon_services;
create policy katalog_admin_services on public.salon_services
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

drop policy if exists katalog_admin_photos on public.salon_photos;
create policy katalog_admin_photos on public.salon_photos
  for all to authenticated using (public.is_katalog_admin()) with check (public.is_katalog_admin());

-- 6. RPC dla panelu admina ----------------------------------------------
-- 6a. Lista użytkowników katalogu (tylko powiązani z katalogiem)
create or replace function public.katalog_admin_users()
returns table (
  id uuid, email text, created_at timestamptz,
  salons_count bigint, jobs_count bigint, is_admin boolean
)
language sql stable security definer set search_path = public, auth as $$
  select u.id, u.email::text, u.created_at,
    (select count(*) from public.salons s where s.owner_id = u.id),
    (select count(*) from public.job_listings j where j.owner_id = u.id),
    exists(select 1 from public.katalog_admins a where a.user_id = u.id)
  from auth.users u
  where public.is_katalog_admin()
    and (
      exists(select 1 from public.salons s where s.owner_id = u.id)
      or exists(select 1 from public.job_listings j where j.owner_id = u.id)
      or exists(select 1 from public.katalog_admins a where a.user_id = u.id)
      or exists(select 1 from public.katalog_profiles p where p.id = u.id)
    )
  order by u.created_at desc;
$$;
grant execute on function public.katalog_admin_users() to authenticated;

-- 6b. Nadanie / odebranie roli admina katalogu (tylko obecny admin)
create or replace function public.katalog_set_admin(target uuid, make_admin boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_katalog_admin() then
    raise exception 'forbidden: not a katalog admin';
  end if;
  if make_admin then
    insert into public.katalog_admins(user_id) values (target) on conflict (user_id) do nothing;
  else
    delete from public.katalog_admins where user_id = target;
  end if;
end;
$$;
grant execute on function public.katalog_set_admin(uuid, boolean) to authenticated;

-- 6c. Statystyki katalogu
create or replace function public.katalog_admin_stats()
returns json
language sql stable security definer set search_path = public, auth as $$
  select case when public.is_katalog_admin() then json_build_object(
    'salons_total',  (select count(*) from public.salons),
    'salons_active', (select count(*) from public.salons where status = 'active'),
    'jobs_total',    (select count(*) from public.job_listings),
    'jobs_active',   (select count(*) from public.job_listings where status = 'active' and (expires_at is null or expires_at > now())),
    'jobs_paid',     (select count(*) from public.job_listings where payment_status = 'paid'),
    'revenue_pln',   (select coalesce(sum(price_pln), 0) from public.job_listings where payment_status = 'paid'),
    'users_total',   (select count(*) from auth.users u where
        exists(select 1 from public.salons s where s.owner_id = u.id)
        or exists(select 1 from public.job_listings j where j.owner_id = u.id)
        or exists(select 1 from public.katalog_profiles p where p.id = u.id))
  ) else null end;
$$;
grant execute on function public.katalog_admin_stats() to authenticated;

-- ============================================================
-- BOOTSTRAP pierwszego admina (uruchom raz, po rejestracji konta):
--   insert into public.katalog_admins (user_id)
--   select id from auth.users where lower(email) = lower('twoj@email.pl')
--   on conflict do nothing;
-- ============================================================
