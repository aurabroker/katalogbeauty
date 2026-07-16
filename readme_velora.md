# VELORA — dziennik wdrożenia (progress log)

Portal beauty łączący trzy filary: **katalog salonów z rezerwacją**, **marketplace
pracy** (salony ↔ specjaliści) i **szkolenia** z certyfikacją. Ten plik jest
aktualizowany po każdym udanym deployu i stanowi źródło prawdy o tym, co już
wdrożono w designie VELORA, a co jest zaplanowane.

Estetyka: *editorial beauty magazine* — ciepła paleta nude/beż, złoto/miedź i róż,
głęboki grafit. Nagłówki **Playfair Display**, UI/body **Hanken Grotesk**.

---

## Decyzje kierunkowe (ustalone z zamawiającym)

1. **Fundament:** rozwijamy istniejący stack — **NIE** przepisujemy na Next.js.
   Design VELORA to referencja; odtwarzamy go w obecnym środowisku.
2. **Marka:** pełny rebrand **BeautyKatalog → VELORA** (nazwa, wordmark, paleta,
   typografia).
3. **Kolejność:** etap 1 = **landing page** w designie VELORA. Kolejne etapy niżej.
4. **Backend nowych funkcji** (szkolenia, abonamenty, płatności): najpierw
   front/design na danych przykładowych, realna integracja w kolejnych etapach.

## Stack

- **SvelteKit** (Svelte 5, runy `$state`/`$derived`) + **Vite** + **TypeScript**
- **adapter-cloudflare** — SSR on-demand na Cloudflare Pages/Workers
- **Supabase** (auth + Postgres + Storage), typowany klient `createClient<Database>`
- **Leaflet.js** + OpenStreetMap (mapa listingu na `/szukaj`)
- Google Fonts przez `app.html`: **Playfair Display** + **Hanken Grotesk**

Design tokeny VELORA żyją centralnie w `src/app.css` (`:root`), więc reskin objął
całą aplikację naraz. Komponenty budujemy w Svelte + scoped CSS na tych tokenach.
Ewentualne wprowadzenie Tailwinda (zgodnie z handoffem) jest opcjonalne i najlepiej
zrobić je przy budowie wspólnej biblioteki komponentów (sekcja 07 handoffu) — tokeny
są już scentralizowane, więc migracja będzie prosta.

---

## Zrealizowane etapy

### Etap 1 — Landing + rebrand tokenów · 2026-07-15

**Tokeny i marka (globalnie):**
- `src/app.css` — `:root` przemapowany na **paletę VELORA** (porcelain, linen, sand,
  almond, blush, rose, graphite, espresso, ink, gold, copper, champagne, sidebar-bg),
  pełny zestaw pill-statusów (sukces/ostrzeżenie/błąd/info/neutral/premium), promienie
  (16/10/20/24/pill), cienie (`card`/`lift`/`float`), keyframe `velFloat` z obsługą
  `prefers-reduced-motion`. Stare nazwy zmiennych zachowane jako aliasy → wszystkie
  istniejące podstrony (katalog, salon, praca, panele, admin) dostały nowy skin bez
  zmian w kodzie.
- Fonty: `src/app.html` — Fraunces/Inter → **Playfair Display + Hanken Grotesk**,
  `theme-color` = `#FBF7F1`.
- Przyciski primary: ink → hover miedź (zgodnie z VELORA); CTA nawigacji: ink pill.

**Nawigacja (`src/lib/components/Nav.svelte`):**
- Wordmark VELORA (monogram „V" w kole ze złotym obrysem + serif wordmark).
- Linki: Salony `/`, Praca `/jobs`, Szkolenia `/#szkolenia`, Dla salonów `/panel`.
- Akcje: „Zaloguj" + „Dołącz" (ink pill).
- **Mobilny dolny tab bar** (Salony / Praca / Szkolenia / Konto) z ikonami SVG,
  widoczny < 768px; `body` dostaje bezpieczny `padding-bottom`.

**Landing (`src/routes/+page.svelte` + `+page.ts`):**
- **Hero** — H1 Playfair z italic-miedzianym akcentem, trójzakładkowa wyszukiwarka
  (Salon → `/szukaj?q=&gdzie=`, Praca → `/jobs`, Szkolenie → scroll do sekcji),
  statystyki, portret + dwie pływające karty (`velFloat`).
- **Wyróżnione salony** — grid 3 kol., realne dane z Supabase (6 najnowszych, okładka
  z galerii, liczba usług); przy braku danych 6 neutralnych placeholderów.
- **Band B2B** (espresso, radius 24) — CTA „Dołącz jako salon" (złoto) + „Zobacz
  cennik", 3 karty statów (+30% / 7 dni / 0 zł).
- **Popularne oferty pracy** — chipy filtrów + poziome karty z monogramem, badge
  typu (Zatrudnię/Szukam pracy), widełki; realne dane (do 5) lub placeholdery.
- **Polecane szkolenia** — grid 4 karty (placeholder — filar w budowie; „Zapisz się"
  pokazuje toast „wkrótce").
- **Social proof** — 3 karty cytatów (placeholder).
- **Stopka VELORA** — brand + opis + social + 3 kolumny linków + pasek prawny
  (Regulamin, Polityka prywatności/RODO, Cookies).
- Responsywność: 3→2→1 kolumna, wyszukiwarka układa pola pionowo na mobile.

Weryfikacja: `npm run check` (0 błędów), `npm run build` OK, zrzuty desktop 1280 +
mobile 390 zgodne z referencją VELORA (sekcja 03).

**Zdjęcia (2026-07-16):** wgrane przez zamawiającego PNG-i (2752×1536, ~6 MB każdy)
zoptymalizowane przez `sharp` do **WebP** (`static/*.webp`, łącznie ~305 KB zamiast
~45 MB). Podpięte: `hero.webp` w tło hero (z overlayem dla czytelności podpisu) oraz
6 okładek `salon-0X-*.webp` w karty „Wyróżnione salony" (kategorie dopasowane do
nazw plików). Źródłowe PNG-i pozostają w `static/` — do usunięcia po akceptacji
(nieużywane, bez nich repo/deploy odchudza się o ~45 MB). Uwaga: na `main`
z wcześniejszego uploadu leży też stray `hero.png` w root repo (nieużywany).

**Deploy produkcyjny (2026-07-16):** gałąź `claude/beauty-portal-rebuild-e1gkqx`
scalona do `main` i wypchnięta — Cloudflare Pages buduje produkcję z `main`.

---

### Etap 2 — App-shell VELORA + Salon panel · 2026-07-16

**Reużywalny app-shell (`src/lib/components/PanelShell.svelte`):**
- Ciemny sidebar 250px (`--sidebar-bg`), monogram + wordmark VELORA, grupowana
  nawigacja z ikonami SVG, aktywny element z lewym złotym borderem i miękkim tłem,
  badge (zwykły/alert), karta konta + wylogowanie na dole, opcjonalny slot upsell.
- Topbar 70px: breadcrumb + tytuł, pole wyszukiwania, dzwonek z kropką, avatar.
- Warianty akcentu: `gold` (Salon/Admin) i `rose` (Klient) — sterowane propem.
- Responsywny: < 900px sidebar jako wysuwany drawer (hamburger + backdrop).

**Salon panel (`/panel`) przełożony na app-shell (akcent gold):**
- Nawigacja sidebar: Pulpit · Profil firmy · Usługi i cennik · Galeria ·
  (Rekrutacja) Oferty pracy · (Konto) Abonament. Dotychczasowe zakładki/formularze
  (dane firmy, REGON, cennik CRUD, upload zdjęć) zachowane bez zmian.
- **Pulpit** (nowy): KPI (status profilu, liczba zabiegów, zdjęć, abonament),
  pasek kompletności profilu (liczony z realnych danych), szybkie akcje, miejsce
  na grafik (kalendarz w przygotowaniu).
- **Abonament** (nowy): karty Free / **Pro (featured)** / Premium z checklistą i CTA
  (płatności — placeholder/toast „wkrótce").
- `+layout.svelte`: publiczna nawigacja ukryta na trasach z app-shellem (`/panel`);
  ekran logowania panelu ma własny link „← Strona główna VELORA".

Weryfikacja: `npm run check` 0 błędów, `npm run build` OK, shell zweryfikowany
zrzutem (desktop + mobile drawer). Zalogowany pulpit renderuje się z realnych
danych salonu (auth przez Supabase).

### Etap 2b — Panel Admina + Panel Klienta · 2026-07-16

- **Panel Admina (`/admin`)** przełożony na `PanelShell` (akcent gold): nawigacja
  sidebar (Pulpit · Ogłoszenia z badge liczby oczekujących · Salony · Użytkownicy),
  nowy **Pulpit** z KPI (aktywne salony, ogłoszenia, użytkownicy, przychód — realne
  dane z `katalog_admin_stats`) i kolejką moderacji. Funkcje moderacji, dodawania
  ogłoszeń, zarządzania salonami i rolami — bez zmian.
- **Panel Klienta (`/klient`, nowy)** na `PanelShell` z akcentem **rose**: Pulpit
  (KPI: najbliższa wizyta, zapisane salony, aplikacje, szkolenia), nadchodzące
  rezerwacje, profil/CV z paskiem kompletności i tagami umiejętności, status
  aplikacji (stage-pill) i moje szkolenia (pasek postępu). Dane demonstracyjne —
  do podpięcia pod backend. Auth przez Supabase; mobilny tab „Konto" → `/klient`.
- `+layout`: `/admin` i `/klient` dodane do tras z ukrytą publiczną nawigacją.

Weryfikacja: `npm run check` 0 błędów, `npm run build` OK; akcent rose zweryfikowany
zrzutem. **Cały Etap 2 (app-shell + 3 panele) scalony do `main`.**

### Etap 3 — Filar Szkolenia (UI + tabele, płatność makieta) · 2026-07-16

- **Supabase:** migracja `supabase/migrations/20260716_velora_trainings.sql`
  (zastosowana na projekcie `dhuvykwecsxgchzxufxw`): tabele **`trainings`** i
  **`training_enrollments`** z izolacją `source='katalog'` i RLS (publiczny odczyt
  aktywnych, insert/select własnych zapisów, pełny dostęp `is_katalog_admin`).
  Zseedowano **6 szkoleń demonstracyjnych** (placeholdery — usuwalne).
  Typy dodane w `database.types.ts` (`Training`, `TrainingEnrollment`).
- **Katalog `/szkolenia`:** siatka kart (obraz/gradient, kategoria, tytuł,
  format·miasto·termin, cena + wolne miejsca, „Zapisz się") + filtr kategorii;
  dane z Supabase, fallback demo na landingu.
- **Szczegół `/szkolenia/[slug]`:** stepper 3-krokowy — szczegóły → **checkout
  (makieta)** z podsumowaniem VAT 23%, zakładkami Karta/BLIK/Przelewy24, stanem
  `idle→processing→success` → **potwierdzenie** (dostęp, przypomnienie, certyfikat).
  Po opłaceniu (zalogowany) tworzy się wpis w `training_enrollments`.
- **Wiring:** Nav „Szkolenia" i landing „Polecane szkolenia" → `/szkolenia`
  (realne dane); helpery `formatLabel`/`trainingDate`/`seatsLabel` w `utils.ts`.

Płatność jest **makietą** (bez realnego obciążenia) — podłączenie Przelewy24/Stripe
(klucze + webhooki) to osobny krok. Weryfikacja: `npm run check` 0 błędów,
`npm run build` OK. Uwaga: w sandboxie Supabase jest nieosiągalny sieciowo, więc
katalog renderuje realne dane dopiero na produkcji (Cloudflare).

## Roadmap (kolejne etapy)
- **Etap 4 — Marketplace pracy 2.0:** flow aplikacji o pracę + CV, lejek kandydata
  po stronie salonu.
- **Etap 5 — Abonamenty B2B:** Free / Pro / Premium + onboarding salonu (stepper 4).
- **Etap 6 — Biblioteka komponentów + tokeny (sekcja 07)**, opcjonalnie Tailwind.
- **Odłożone:** rezerwacja wizyty (wybór usługi → termin → potwierdzenie).

## Placeholdery do podmiany na realne dane

- Statystyki hero (2 400+ / 18 000+ / 120+), pływające karty hero.
- Sekcja „Polecane szkolenia" (cały filar jest jeszcze demonstracyjny).
- Sekcja „Social proof" (cytaty).
- Karty salonów/ofert pokazują dane z Supabase, gdy są dostępne; w przeciwnym razie
  neutralne placeholdery „Studio 0X".

---

## Uruchomienie i deploy

```bash
npm install
npm run dev      # serwer deweloperski (pełny SSR)
npm run check    # svelte-check (TypeScript / a11y)
npm run build    # build produkcyjny (-> .svelte-kit/cloudflare)
```

Deploy: **Cloudflare Pages przez integrację Git** (zalecane) — push na gałąź buduje
i publikuje automatycznie (build command `npm run build`, output
`.svelte-kit/cloudflare`). Alternatywnie CLI: `npm run deploy` (wymaga
`CLOUDFLARE_API_TOKEN` / `wrangler login`).

Konfiguracja Supabase, Turnstile i pierwszy admin — patrz `README.md`.
