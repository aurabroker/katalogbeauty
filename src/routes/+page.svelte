<script lang="ts">
  import { onMount } from 'svelte';
  import { plural, uniqueCities, salaryLabel } from '$lib/utils';
  import SalonCard from '$lib/components/SalonCard.svelte';
  import SpecialistCard from '$lib/components/SpecialistCard.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';
  import type { SalonWithRelations } from '$lib/database.types';

  let { data }: PageProps = $props();

  const PER_PAGE = 12;

  const allSalons = $derived(data.salons);
  let q = $state('');
  let city = $state('');
  let activeCat = $state<number | null>(null);
  let page = $state(0);
  let showMap = $state(false);

  let mapEl = $state<HTMLDivElement>();
  let mapInstance: any = null;
  let mapMarkers: any[] = [];
  let L: any = null;

  const cities = $derived(uniqueCities(allSalons));

  const filtered = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    return allSalons.filter((s) => {
      if (city && s.city !== city) return false;
      if (activeCat && !(s.services ?? []).some((sv) => sv.category_id === activeCat)) return false;
      if (needle && !`${s.name} ${s.city} ${s.description ?? ''}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  });

  const visible = $derived(filtered.slice(0, (page + 1) * PER_PAGE));
  const countLabel = $derived(plural(filtered.length, 'salon', 'salony', 'salonów'));

  function toggleCat(id: number) {
    activeCat = activeCat === id ? null : id;
  }

  $effect(() => {
    q;
    city;
    activeCat;
    page = 0;
  });

  onMount(async () => {
    L = (await import('leaflet')).default;
  });

  function refreshMap() {
    if (!L || !mapEl) return;
    if (!mapInstance) {
      mapInstance = L.map(mapEl).setView([52.0, 19.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }).addTo(mapInstance);
    }
    mapMarkers.forEach((m) => m.remove());
    mapMarkers = filtered
      .filter((s: SalonWithRelations) => s.latitude && s.longitude)
      .map((s: SalonWithRelations) => {
        const m = L.marker([s.latitude, s.longitude]).addTo(mapInstance);
        m.bindPopup(`<b>${s.name}</b><br>${s.city}<br><a href="/salon/${s.id}">Zobacz profil →</a>`);
        return m;
      });
  }

  $effect(() => {
    if (showMap) {
      filtered;
      refreshMap();
      setTimeout(() => mapInstance?.invalidateSize(), 150);
    }
  });
</script>

<svelte:head>
  <title>BeautyKatalog — Katalog Salonów Beauty w Polsce</title>
  <meta
    name="description"
    content="Znajdź salon, zabieg lub specjalistę beauty w swojej okolicy. Salony, portfolia specjalistów, ceny i oferty pracy w branży beauty."
  />
</svelte:head>

<section class="hero">
  <div class="bk-container">
    <p class="eyebrow">BeautyKatalog · Polska</p>
    <h1>Znajdź salon, zabieg<br />lub specjalistę w okolicy</h1>
    <p class="lead">
      Przeglądaj salony, portfolia specjalistów i cenniki — fryzjerstwo, paznokcie, brwi i rzęsy,
      barber, kosmetyka, makijaż, masaż.
    </p>

    <div class="search">
      <input
        type="search"
        class="co"
        placeholder="Salon, zabieg lub specjalista…"
        aria-label="Czego szukasz"
        bind:value={q}
      />
      <select class="gdzie" aria-label="Gdzie" bind:value={city}>
        <option value="">Cała Polska</option>
        {#each cities as c}<option value={c}>{c}</option>{/each}
      </select>
    </div>

    {#if data.categories.length}
      <div class="chips">
        {#each data.categories as cat}
          <button
            class="bk-chip"
            class:active={activeCat === cat.id}
            onclick={() => toggleCat(cat.id)}
          >
            {cat.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- SEKCJA: Salony w pobliżu -->
<section class="bk-container block">
  <div class="sec-head">
    <h2>Salony w pobliżu</h2>
    <div class="sec-tools">
      <span class="count">{countLabel}</span>
      <a
        class="bk-btn bk-btn-outline tool"
        href="/szukaj{q || city || activeCat
          ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(city ? { gdzie: city } : {}), ...(activeCat ? { cat: String(activeCat) } : {}) }).toString()}`
          : ''}"
      >
        Więcej filtrów →
      </a>
      <button class="bk-btn bk-btn-outline tool" onclick={() => (showMap = !showMap)}>
        {showMap ? '☰ Lista' : '🗺 Mapa'}
      </button>
    </div>
  </div>

  <div class="map" class:hidden={!showMap} bind:this={mapEl}></div>

  {#if data.loadError}
    <div class="bk-empty"><h3>Nie udało się załadować salonów</h3><p>{data.loadError}</p></div>
  {:else if filtered.length === 0}
    <div class="bk-empty">
      <h3>Brak wyników</h3>
      <p>Spróbuj innych słów kluczowych lub usuń filtry.</p>
    </div>
  {:else}
    <div class="grid">
      {#each visible as salon (salon.id)}
        <SalonCard {salon} />
      {/each}
    </div>
    {#if filtered.length > visible.length}
      <div class="more-wrap">
        <button class="bk-btn bk-btn-outline" onclick={() => (page += 1)}>Załaduj więcej</button>
      </div>
    {/if}
  {/if}
</section>

<!-- SEKCJA: Specjaliści (wyróżnik produktu §9.1) -->
{#if data.specialists.length}
  <section class="bk-container block">
    <div class="sec-head">
      <h2>Specjaliści</h2>
      <p class="sec-sub">Opinie i portfolio wędrują za osobą — nie za salonem.</p>
    </div>
    <div class="grid specialists">
      {#each data.specialists as specialist (specialist.id)}
        <SpecialistCard {specialist} />
      {/each}
    </div>
  </section>
{/if}

<!-- PASEK: Pracuj w beauty (most do rynku pracy §9.1) -->
<section class="work">
  <div class="bk-container work-inner">
    <div class="work-copy">
      <p class="eyebrow accent">Dla branży</p>
      <h2>Pracuj w beauty</h2>
      <p>Etat, B2B albo wynajem fotela — oferty pracy i ogłoszenia specjalistów w jednym miejscu.</p>
      <a href="/jobs" class="bk-btn bk-btn-primary">Zobacz oferty pracy</a>
    </div>
    {#if data.featuredJobs.length}
      <div class="work-jobs">
        {#each data.featuredJobs as job (job.id)}
          <a href="/jobs" class="job-row">
            <span class="job-type" class:looking={job.type === 'looking'}>
              {job.type === 'hiring' ? 'Zatrudnię' : 'Szukam pracy'}
            </span>
            <span class="job-title">{job.title}</span>
            <span class="job-meta">
              {job.city}{salaryLabel(job.salary_from, job.salary_to)
                ? ` · ${salaryLabel(job.salary_from, job.salary_to)}`
                : ''}
            </span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>

<Footer>
  © 2026 BeautyKatalog by Aura Consulting · <a href="/">BeautyPolisa OC</a>
</Footer>

<style>
  /* HERO */
  .hero {
    background: var(--card);
    border-bottom: 1px solid var(--line);
    padding: 4rem 0 3rem;
    color: var(--ink);
  }
  .eyebrow {
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.85rem;
  }
  .hero h1 {
    font-size: clamp(2rem, 5vw, 3.1rem);
    margin-bottom: 0.7rem;
    color: var(--ink);
  }
  .lead {
    font-size: 1.02rem;
    color: var(--ink-2);
    margin-bottom: 2rem;
    max-width: 560px;
  }
  .search {
    display: flex;
    gap: 0.6rem;
    max-width: 620px;
    flex-wrap: wrap;
  }
  .search .co {
    flex: 1;
    min-width: 220px;
    padding: 0.85rem 1.15rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-sm);
    font-size: 0.95rem;
    outline: none;
    background: var(--paper);
    color: var(--ink);
    transition: 0.15s;
  }
  .search .gdzie {
    padding: 0.85rem 1.15rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-sm);
    font-size: 0.95rem;
    outline: none;
    background: var(--paper);
    color: var(--ink);
    min-width: 160px;
    transition: 0.15s;
  }
  .search .co:focus,
  .search .gdzie:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(181, 83, 46, 0.12);
  }
  .chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1.1rem;
  }

  /* SEKCJE */
  .block {
    padding-top: 2.75rem;
    padding-bottom: 0.5rem;
  }
  .sec-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.4rem;
  }
  .sec-head h2 {
    font-size: 1.6rem;
  }
  .sec-sub {
    font-size: 0.88rem;
    color: var(--ink-2);
    max-width: 360px;
  }
  .sec-tools {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
  .count {
    font-size: 0.82rem;
    color: var(--ink-3);
  }
  .tool {
    padding: 0.4rem 0.9rem;
    font-size: 0.8rem;
  }
  .map {
    height: 420px;
    border-radius: var(--r);
    overflow: hidden;
    margin-bottom: 1.5rem;
    border: 1px solid var(--line);
  }
  .map.hidden {
    display: none;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
  .grid.specialists {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  .more-wrap {
    text-align: center;
    margin-top: 2rem;
  }

  /* PASEK PRACUJ W BEAUTY */
  .work {
    background: var(--blush);
    margin-top: 3rem;
    padding: 3rem 0;
  }
  .work-inner {
    display: flex;
    gap: 2.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .work-copy {
    flex: 1;
    min-width: 260px;
  }
  .eyebrow.accent {
    color: var(--accent-d);
  }
  .work-copy h2 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  .work-copy p {
    color: var(--accent-d);
    margin-bottom: 1.25rem;
    max-width: 420px;
    font-size: 0.95rem;
  }
  .work-jobs {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-width: 280px;
    flex: 1;
  }
  .job-row {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas:
      'type title'
      'type meta';
    column-gap: 0.75rem;
    align-items: center;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: var(--r-sm);
    padding: 0.8rem 1rem;
    transition: border-color 0.2s;
  }
  .job-row:hover {
    border-color: var(--line-strong);
  }
  .job-type {
    grid-area: type;
    align-self: center;
    font-size: 0.66rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #fff;
    background: var(--accent);
    padding: 0.25rem 0.55rem;
    border-radius: 9999px;
    white-space: nowrap;
  }
  .job-type.looking {
    background: var(--ink);
  }
  .job-title {
    grid-area: title;
    font-weight: 500;
    font-size: 0.92rem;
  }
  .job-meta {
    grid-area: meta;
    font-size: 0.78rem;
    color: var(--ink-3);
  }

  @media (max-width: 640px) {
    .sec-head h2 {
      font-size: 1.35rem;
    }
  }
</style>
