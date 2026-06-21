<script>
  import { onMount } from 'svelte';
  import { sb } from '$lib/supabase';
  import { plural, uniqueCities } from '$lib/utils';
  import SalonCard from '$lib/components/SalonCard.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import Footer from '$lib/components/Footer.svelte';

  const PER_PAGE = 12;

  let allSalons = $state([]);
  let loading = $state(true);
  let error = $state('');
  let q = $state('');
  let city = $state('');
  let page = $state(0);
  let showMap = $state(false);

  let mapEl = $state();
  let mapInstance = null;
  let mapMarkers = [];
  let L = null;

  const cities = $derived(uniqueCities(allSalons));

  const filtered = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    return allSalons.filter((s) => {
      if (city && s.city !== city) return false;
      if (needle && !`${s.name} ${s.city} ${s.description ?? ''}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  });

  const visible = $derived(filtered.slice(0, (page + 1) * PER_PAGE));
  const countLabel = $derived(plural(filtered.length, 'salon', 'salony', 'salonów'));

  // reset paginacji przy zmianie filtrów
  $effect(() => {
    q;
    city;
    page = 0;
  });

  onMount(async () => {
    const { data, error: err } = await sb
      .from('salons')
      .select(
        'id,name,slug,city,street,tagline,description,lat,lng,salon_photos(url,is_cover),salon_services(id)'
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    loading = false;
    if (err) {
      error = err.message;
      return;
    }
    allSalons = data ?? [];
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
      .filter((s) => s.lat && s.lng)
      .map((s) => {
        const m = L.marker([s.lat, s.lng]).addTo(mapInstance);
        m.bindPopup(`<b>${s.name}</b><br>${s.city}<br><a href="/salon/${s.id}">Zobacz profil →</a>`);
        return m;
      });
  }

  // odśwież markery, gdy mapa widoczna i zmieni się lista
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
    content="Znajdź najlepszy salon beauty w Polsce. Przeglądaj salony, zabiegi, ceny i rezerwuj wizyty online."
  />
</svelte:head>

<section class="hero">
  <div class="bk-container">
    <p class="eyebrow">BeautyKatalog · Polska</p>
    <h1>Znajdź salon beauty<br />w swoim mieście</h1>
    <p class="lead">
      Przeglądaj salony kosmetyczne, fryzjerskie, podologiczne i kosmetologiczne w całej Polsce.
    </p>
    <div class="search">
      <input type="search" placeholder="Szukaj salonu, miasta, zabiegu..." aria-label="Szukaj salonów" bind:value={q} />
    </div>
  </div>
</section>

<div class="filters">
  <div class="bk-container bar">
    <select class="bk-input" style="width:auto;min-width:170px" aria-label="Filtruj po mieście" bind:value={city}>
      <option value="">Wszystkie miasta</option>
      {#each cities as c}<option value={c}>{c}</option>{/each}
    </select>
    <span class="count">{loading ? '' : countLabel}</span>
    <button class="bk-btn bk-btn-outline" style="padding:.4rem .9rem;font-size:.8rem" onclick={() => (showMap = !showMap)}>
      {showMap ? '☰ Lista' : '🗺 Mapa'}
    </button>
  </div>
</div>

<main class="bk-container" style="padding-top:1.75rem;padding-bottom:3rem">
  <div class="map" class:hidden={!showMap} bind:this={mapEl}></div>

  {#if loading}
    <Spinner />
  {:else if error}
    <div class="bk-empty"><h3>Nie udało się załadować salonów</h3><p>{error}</p></div>
  {:else if filtered.length === 0}
    <div class="bk-empty"><h3>Brak wyników</h3><p>Spróbuj innych słów kluczowych lub usuń filtry.</p></div>
  {:else}
    <div class="grid">
      {#each visible as salon (salon.id)}
        <SalonCard {salon} />
      {/each}
    </div>
    {#if filtered.length > visible.length}
      <div style="text-align:center;margin-top:2rem">
        <button class="bk-btn bk-btn-outline" style="padding:.65rem 2rem" onclick={() => (page += 1)}>
          Załaduj więcej
        </button>
      </div>
    {/if}
  {/if}
</main>

<Footer>
  © 2026 BeautyKatalog by Aura Consulting · <a href="/">BeautyPolisa OC</a>
</Footer>

<style>
  .hero {
    background: linear-gradient(135deg, #3b0764 0%, #7c3aed 55%, #a855f7 100%);
    padding: 4rem 0 3rem;
    color: #fff;
  }
  .eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }
  .hero h1 {
    font-size: clamp(1.8rem, 5vw, 3rem);
    margin-bottom: 0.6rem;
  }
  .lead {
    font-size: 1rem;
    opacity: 0.8;
    margin-bottom: 2rem;
    max-width: 520px;
  }
  .search {
    display: flex;
    gap: 0.6rem;
    max-width: 580px;
  }
  .search input {
    flex: 1;
    padding: 0.8rem 1.1rem;
    border: none;
    border-radius: 0.7rem;
    font-size: 0.95rem;
    outline: none;
  }
  .filters {
    background: #fff;
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 58px;
    z-index: 90;
  }
  .bar {
    padding-top: 0.65rem;
    padding-bottom: 0.65rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .count {
    font-size: 0.8rem;
    color: var(--muted);
    font-weight: 600;
    margin-left: auto;
  }
  .map {
    height: 420px;
    border-radius: 1rem;
    overflow: hidden;
    margin-bottom: 1.75rem;
    border: 1px solid var(--border);
  }
  .map.hidden {
    display: none;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
</style>
