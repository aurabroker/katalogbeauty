# BeautyKatalog

Katalog salonów beauty w Polsce — rejestracja salonów, wykaz zabiegów, mapa, panel właściciela, ogłoszenia pracy.

## Stack
- **SvelteKit** (Svelte 5, runy `$state`/`$derived`) + **Vite** + **TypeScript**
- **adapter-cloudflare** — SSR on-demand na Cloudflare Workers/Pages
- **Supabase** (auth + Postgres + Storage), typowany klient `createClient<Database>`
- **Leaflet.js** + OpenStreetMap (mapa)
- Google Fonts: Inter + Montserrat

### Renderowanie
- Strony publiczne (`/`, `/salon/[id]`, `/jobs`) renderują się **po stronie
  serwera (SSR)** — meta tagi i treść trafiają do początkowego HTML (SEO).
  Dane pobierane są w funkcjach `load` (`+page.ts`).
- Panele (`/panel`, `/jobs/panel`) mają `ssr = false` — wymagają sesji
  użytkownika (Supabase auth po stronie klienta).

## Wymagania
- Node.js 18+ (testowane na 22)

## Uruchomienie
```bash
npm install
npm run dev      # serwer deweloperski (pełny SSR)
npm run build    # build produkcyjny (-> .svelte-kit/cloudflare)
npm run check    # svelte-check (TypeScript / a11y)
```

## Deploy na Cloudflare
Output builda (`.svelte-kit/cloudflare`) jest gotowy dla **Cloudflare Pages**.

**Wariant A — CLI (wymaga zalogowania / tokenu):**
```bash
npx wrangler login                  # lub: export CLOUDFLARE_API_TOKEN=...
npm run deploy                      # build + wrangler pages deploy
npm run cf:preview                  # lokalny podgląd na runtime Workers
```

**Wariant B — integracja Git (zalecane):**
W panelu Cloudflare Pages podłącz repozytorium i ustaw:
- Build command: `npm run build`
- Build output directory: `.svelte-kit/cloudflare`
- (opcjonalnie) zmienne `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`

Konfiguracja runtime (nazwa, `nodejs_compat`, katalog wyjściowy) jest w
`wrangler.jsonc`.

## Konfiguracja Supabase
Aplikacja korzysta z projektu **BEAUTY** (`dhuvykwecsxgchzxufxw`) i **współdzieli
bazę** z aplikacją rezerwacyjną. Katalog używa tabel `salons`, `services`,
`gallery_assets` oraz własnej `job_listings`. Dane katalogu są oznaczone
`salons.source = 'katalog'`, dzięki czemu nie mieszają się z salonami systemu
rezerwacji (RLS i panel admina są ograniczone do `source='katalog'`).

Klucz `anon` jest publiczny i wbudowany w `src/lib/supabase.ts`. Bezpieczeństwo
opiera się na politykach **RLS** w Supabase. Wartości można nadpisać zmiennymi
środowiskowymi (prefiks `PUBLIC_`) — zob. `.env.example`:
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

## Ochrona CAPTCHA (Cloudflare Turnstile)
Formularze logowania, rejestracji i resetu hasła (`AuthForm.svelte`) obsługują
Cloudflare Turnstile przez wbudowaną integrację Supabase Auth. Włączenie wymaga
**dwóch** kroków:

1. **Frontend** — ustaw zmienną środowiskową z kluczem witryny (site key):
   ```
   PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
   ```
   Gdy zmienna jest pusta, widget jest pomijany, a formularze działają bez CAPTCHA.
2. **Supabase** — w panelu **Authentication → Attack Protection → Enable CAPTCHA
   protection**, wybierz **Turnstile** i wklej **secret key** (klucz tajny ze
   strony Cloudflare Turnstile). Supabase weryfikuje token po stronie serwera.

Klucze tworzysz w panelu Cloudflare → **Turnstile** (dodaj domenę produkcyjną
oraz `localhost` do testów). Klucze testowe Cloudflare: site `1x00000000000000000000AA`.

## Panel administratora (`/admin`)
Katalog salonów jest bezpłatny; **publikacja ogłoszeń o pracę jest płatna**
(MVP: ręczna aktywacja przez administratora). Panel `/admin` (ukryty, `noindex`)
daje administratorowi: statystyki (w tym przychód), moderację ogłoszeń
(opłać+aktywuj z kwotą i terminem ważności, przedłuż, ukryj, usuń), moderację
salonów (pokaż/ukryj/usuń) oraz zarządzanie użytkownikami (nadanie/odebranie roli
admina).

**Model bezpieczeństwa** — admin katalogu jest **izolowany** od innych aplikacji
w tej samej bazie: tabela `katalog_admins` + funkcja `is_katalog_admin()`
(nie używamy globalnego `is_admin()`/`profiles.rola`). Polityki RLS dają adminowi
pełny dostęp do tabel katalogu, a właściciel może opublikować ogłoszenie
(`status = active`) tylko gdy `payment_status = 'paid'` — paywall egzekwowany
na poziomie bazy. Schemat: `supabase/migrations/20260622_katalog_admin_and_paid_jobs.sql`.

**Nadanie pierwszego admina** (bootstrap — po rejestracji konta w aplikacji):
```sql
insert into public.katalog_admins (user_id)
select id from auth.users where lower(email) = lower('twoj@email.pl')
on conflict do nothing;
```
Kolejnych adminów nadaje się już z panelu (zakładka *Użytkownicy*).

## Struktura
```
src/
  app.html                      powłoka HTML (fonty, leaflet CSS)
  app.css                       globalne style (klasy .bk-*)
  app.d.ts                      typy globalne aplikacji
  lib/
    supabase.ts                 typowany klient Supabase (createClient<Database>)
    database.types.ts           typy schematu bazy (Database, Salon, JobListing…)
    utils.ts                    slug, ceny, daty, województwa
    stores/
      auth.svelte.ts            globalny stan sesji (runy)
      toast.svelte.ts           globalne toasty (runy)
    components/
      Nav, Footer, Toast, Modal, Spinner
      SalonCard, JobCard, AuthForm
  routes/
    +layout.svelte / +layout.ts   Nav + Toast + slot; prerender=false
    +page.svelte / +page.ts       katalog (SSR load) + mapa
    salon/[id]/+page.svelte/.ts   profil salonu (SSR load + 404)
    jobs/+page.svelte / +page.ts  lista ogłoszeń (SSR load)
    panel/+page.svelte / +page.ts panel właściciela (ssr=false, 3 zakładki)
    jobs/panel/+page.svelte/.ts   panel ogłoszeń (ssr=false)
    +error.svelte                 strona błędu (404)
```

## Supabase — tabele
- `salons` — dane salonów (status: active/draft/paused)
- `salon_services` — zabiegi z cenami i czasem
- `salon_photos` — zdjęcia (Storage bucket: `salon-photos`)
- `job_listings` — ogłoszenia pracy (type: hiring/looking)
- `katalog_profiles` — profile właścicieli

## Routing (zmiana względem wersji 1.x)
| Stara wersja (vanilla) | Nowa trasa |
|---|---|
| `index.html` | `/` |
| `salon.html?id=…` | `/salon/[id]` |
| `panel.html` | `/panel` |
| `jobs.html` | `/jobs` |
| `job-panel.html` | `/jobs/panel` |
