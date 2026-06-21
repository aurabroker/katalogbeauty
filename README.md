# BeautyKatalog

Katalog salonów beauty w Polsce — rejestracja salonów, wykaz zabiegów, mapa, panel właściciela, ogłoszenia pracy.

## Stack
- **SvelteKit** (Svelte 5, runy `$state`/`$derived`) + **Vite**
- **adapter-static** — aplikacja działa jako SPA (hosting statyczny)
- **Supabase** (auth + Postgres + Storage)
- **Leaflet.js** + OpenStreetMap (mapa)
- Google Fonts: Inter + Montserrat

## Wymagania
- Node.js 18+ (testowane na 22)

## Uruchomienie
```bash
npm install
npm run dev      # serwer deweloperski
npm run build    # build produkcyjny do katalogu build/
npm run preview  # podgląd builda
npm run check    # svelte-check (typy / a11y)
```

## Konfiguracja Supabase
Klucz `anon` jest publiczny i wbudowany w `src/lib/supabase.js`. Bezpieczeństwo
opiera się na politykach **RLS** w Supabase. Wartości można nadpisać zmiennymi
środowiskowymi (Vite, prefiks `PUBLIC_`) — zob. `.env.example`:
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

## Struktura
```
src/
  app.html                      powłoka HTML (fonty, leaflet CSS)
  app.css                       globalne style (klasy .bk-*)
  lib/
    supabase.js                 klient Supabase
    utils.js                    slug, ceny, daty, województwa
    stores/
      auth.svelte.js            globalny stan sesji (runy)
      toast.svelte.js           globalne toasty (runy)
    components/
      Nav, Footer, Toast, Modal, Spinner
      SalonCard, JobCard, AuthForm
  routes/
    +layout.svelte              Nav + Toast + slot
    +page.svelte                katalog / wyszukiwarka + mapa
    salon/[id]/+page.svelte     profil salonu
    panel/+page.svelte          panel właściciela (auth + 3 zakładki)
    jobs/+page.svelte           lista ogłoszeń pracy
    jobs/panel/+page.svelte     panel ogłoszeń
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
