<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { plural, uniqueCities, priceTier } from '$lib/utils';
  import SalonCard from '$lib/components/SalonCard.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';
  import type { SalonWithRelations } from '$lib/database.types';

  let { data }: PageProps = $props();

  const params = page.url.searchParams;
  let q = $state(params.get('q') ?? '');
  let city = $state(params.get('gdzie') ?? '');
  let activeCat = $state<number | null>(
    params.get('cat') ? Number(params.get('cat')) : null
  );
  let tiers = $state<Set<number>>(new Set());
  let onlyNew = $state(false);
  let showMap = $state(false);

  const NEW_DAYS = 30;
  const isNew = (s: SalonWithRelations) =>
    s.created_at ? Date.now() - new Date(s.created_at).getTime() < NEW_DAYS * 864e5 : false;

  const salonTier = (s: SalonWithRelations) =>
    priceTier((s.services ?? []).map((sv) => sv.price_from));

  const cities = $derived(uniqueCities(data.salons));

  const filtered = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    return data.salons.filter((s) => {
      if (city && s.city !== city) return false;
      if (activeCat && !(s.services ?? []).some((sv) => sv.category_id === activeCat)) return false;
      if (tiers.size && !tiers.has(salonTier(s))) return false;
      if (onlyNew && !isNew(s)) return false;
      if (needle && !`${s.name} ${s.city} ${s.description ?? ''}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  });

  const countLabel = $derived(plural(filtered.length, 'salon', 'salony', 'salonów'));

  function toggleCat(id: number) {
    activeCat = activeCat === id ? null : id;
  }
  function toggleTier(t: number) {
    const next = new Set(tiers);
    next.has(t) ? next.delete(t) : next.add(t);
    tiers = next;
  }
  function clearAll() {
    q = '';
    city = '';
    activeCat = null;
    tiers = new Set();
    onlyNew = false;
  }
  const hasFilters = $derived(
    Boolean(q || city || activeCat || tiers.size || onlyNew)
  );

  // Mapa
  let mapEl = $state<HTMLDivElement>();
  let mapInstance: any = null;
  let mapMarkers: any[] = [];
  let L: any = null;

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
      .filter((s) => s.latitude && s.longitude)
      .map((s) => {
        const m = L.marker([s.latitude as number, s.longitude as number]).addTo(mapInstance);
        m.bindPopup(`<b>${s.name}</b><br>${s.city ?? ''}<br><a href="/salon/${s.id}">Zobacz profil →</a>`);
        return m;
      });
  }

  $effect(() => {
    if (L && mapEl) {
      filtered;
      refreshMap();
      setTimeout(() => mapInstance?.invalidateSize(), 150);
    }
  });
</script>

<svelte:head>
  <title>Wyszukiwanie salonów — BeautyKatalog</title>
  <meta name="description" content="Przeszukaj katalog salonów beauty — filtruj po kategorii, mieście, cenie i nowości." />
</svelte:head>

<div class="bk-container topbar">
  <input
    type="search"
    class="bk-input search"
    placeholder="Salon, zabieg lub specjalista…"
    aria-label="Szukaj"
    bind:value={q}
  />
  <span class="count">{data.loadError ? 'Błąd ładowania' : countLabel}</span>
  <button class="bk-btn bk-btn-outline maptoggle" onclick={() => (showMap = !showMap)}>
    {showMap ? '☰ Lista' : '🗺 Mapa'}
  </button>
</div>

<main class="bk-container layout">
  <!-- FILTRY -->
  <aside class="filters">
    <div class="f-head">
      <h2>Filtry</h2>
      {#if hasFilters}<button class="clear" onclick={clearAll}>Wyczyść</button>{/if}
    </div>

    <div class="f-group">
      <p class="f-label">Kategoria</p>
      <div class="f-chips">
        {#each data.categories as cat}
          <button class="bk-chip" class:active={activeCat === cat.id} onclick={() => toggleCat(cat.id)}>
            {cat.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="f-group">
      <p class="f-label">Miasto</p>
      <select class="bk-input" bind:value={city}>
        <option value="">Cała Polska</option>
        {#each cities as c}<option value={c}>{c}</option>{/each}
      </select>
    </div>

    <div class="f-group">
      <p class="f-label">Poziom cenowy</p>
      <div class="f-chips">
        {#each [1, 2, 3] as t}
          <button class="bk-chip" class:active={tiers.has(t)} onclick={() => toggleTier(t)}>
            {'zł'.repeat(t)}
          </button>
        {/each}
      </div>
    </div>

    <div class="f-group">
      <label class="f-check">
        <input type="checkbox" bind:checked={onlyNew} />
        Tylko nowości
      </label>
    </div>
  </aside>

  <!-- LISTA -->
  <section class="list-pane" class:hidden-mobile={showMap}>
    {#if data.loadError}
      <div class="bk-empty"><h3>Nie udało się załadować salonów</h3><p>{data.loadError}</p></div>
    {:else if filtered.length === 0}
      <div class="bk-empty">
        <h3>Brak wyników</h3>
        <p>Zmień filtry lub <button class="linklike" onclick={clearAll}>wyczyść wszystkie</button>.</p>
      </div>
    {:else}
      <div class="grid">
        {#each filtered as salon (salon.id)}
          <SalonCard {salon} isNew={isNew(salon)} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- MAPA -->
  <aside class="map-pane" class:show-mobile={showMap}>
    <div class="map" bind:this={mapEl}></div>
  </aside>
</main>

<Footer>© 2026 BeautyKatalog by Aura Consulting · <a href="/">← Katalog</a></Footer>

<style>
  .topbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding-top: 1.25rem;
    padding-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .search {
    flex: 1;
    min-width: 200px;
    max-width: 460px;
  }
  .count {
    font-size: 0.85rem;
    color: var(--ink-3);
  }
  .maptoggle {
    padding: 0.45rem 0.95rem;
    font-size: 0.82rem;
    margin-left: auto;
    display: none;
  }

  .layout {
    display: grid;
    grid-template-columns: 230px 1fr 360px;
    gap: 1.75rem;
    align-items: start;
    padding-bottom: 4rem;
  }

  /* FILTRY */
  .filters {
    position: sticky;
    top: 78px;
    border: 1px solid var(--line);
    border-radius: var(--r);
    background: var(--card);
    padding: 1.25rem;
  }
  .f-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .f-head h2 {
    font-size: 1.1rem;
  }
  .clear {
    background: none;
    border: none;
    color: var(--accent);
    font-size: 0.8rem;
    font-weight: 500;
  }
  .f-group {
    padding: 0.9rem 0;
    border-top: 1px solid var(--line);
  }
  .f-group:first-of-type {
    border-top: none;
    padding-top: 0;
  }
  .f-label {
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    margin-bottom: 0.6rem;
  }
  .f-chips {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .f-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    color: var(--ink);
    cursor: pointer;
  }
  .f-check input {
    accent-color: var(--accent);
    width: 1rem;
    height: 1rem;
  }

  /* LISTA */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.1rem;
  }
  .linklike {
    background: none;
    border: none;
    color: var(--accent);
    font: inherit;
    cursor: pointer;
    padding: 0;
  }

  /* MAPA */
  .map-pane {
    position: sticky;
    top: 78px;
  }
  .map {
    height: calc(100vh - 110px);
    min-height: 420px;
    border-radius: var(--r);
    overflow: hidden;
    border: 1px solid var(--line);
  }

  /* ≤1024: ukryj kolumnę mapy, przełączaj lista/mapa */
  @media (max-width: 1024px) {
    .layout {
      grid-template-columns: 220px 1fr;
    }
    .maptoggle {
      display: inline-flex;
    }
    .map-pane {
      display: none;
      grid-column: 1 / -1;
      position: static;
    }
    .map-pane.show-mobile {
      display: block;
    }
    .map {
      height: 70vh;
    }
    .list-pane.hidden-mobile {
      display: none;
    }
  }

  /* ≤720: filtry nad listą */
  @media (max-width: 720px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .filters {
      position: static;
    }
  }
</style>
