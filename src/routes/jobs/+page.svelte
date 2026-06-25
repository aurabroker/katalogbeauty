<script lang="ts">
  import { plural, uniqueCities } from '$lib/utils';
  import JobCard from '$lib/components/JobCard.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const PER_PAGE = 12;

  const allJobs = $derived(data.jobs);
  let q = $state('');
  let filterType = $state('');
  let filterCity = $state('');
  let page = $state(0);

  const cities = $derived(uniqueCities(allJobs));

  const filtered = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    return allJobs.filter((j) => {
      if (filterType && j.type !== filterType) return false;
      if (filterCity && j.city !== filterCity) return false;
      if (needle && !`${j.title} ${j.city} ${j.description ?? ''}`.toLowerCase().includes(needle))
        return false;
      return true;
    });
  });

  const visible = $derived(filtered.slice(0, (page + 1) * PER_PAGE));
  const countLabel = $derived(
    filtered.length === 0 ? 'Brak ogłoszeń' : plural(filtered.length, 'ogłoszenie', 'ogłoszenia', 'ogłoszeń')
  );

  $effect(() => {
    q;
    filterType;
    filterCity;
    page = 0;
  });

  const types = [
    { id: '', label: 'Wszystkie' },
    { id: 'hiring', label: '💼 Zatrudnię' },
    { id: 'looking', label: '🙋 Szukam pracy' }
  ];
</script>

<svelte:head>
  <title>Praca w Beauty — BeautyKatalog</title>
  <meta
    name="description"
    content="Ogłoszenia pracy w branży beauty. Szukam pracy i zatrudnię — fryzjer, kosmetolog, wizażysta, podolog."
  />
</svelte:head>

<section class="hero">
  <div class="bk-container">
    <p class="eyebrow">BeautyKatalog · Praca</p>
    <h1>Praca w branży beauty</h1>
    <p class="lead">Ogłoszenia dla fryzjerów, kosmetologów, wizażystów, podologów i nie tylko.</p>
    <div class="search">
      <input type="search" placeholder="Stanowisko, miasto, słowo kluczowe..." aria-label="Szukaj ogłoszeń" bind:value={q} />
    </div>
  </div>
</section>

<div class="filters">
  <div class="bk-container bar">
    <div class="types">
      {#each types as t}
        <button
          class="bk-btn"
          class:on={filterType === t.id}
          style="padding:.35rem .85rem;font-size:.8rem"
          onclick={() => (filterType = t.id)}
        >
          {t.label}
        </button>
      {/each}
    </div>
    <select class="bk-input" style="width:auto;min-width:150px;font-size:.8rem" bind:value={filterCity}>
      <option value="">Wszystkie miasta</option>
      {#each cities as c}<option value={c}>{c}</option>{/each}
    </select>
    <span class="count">{countLabel}</span>
    <a href="/jobs/panel" class="bk-btn bk-btn-primary" style="font-size:.8rem;padding:.4rem .9rem;flex-shrink:0">+ Dodaj ogłoszenie</a>
  </div>
</div>

<main class="bk-container" style="padding-top:1.75rem;padding-bottom:3rem">
  {#if data.loadError}
    <div class="bk-empty"><h3>Błąd ładowania</h3><p>{data.loadError}</p></div>
  {:else if filtered.length === 0}
    <div class="bk-empty">
      <h3>Brak ogłoszeń</h3>
      <p>Spróbuj innych filtrów lub <a href="/jobs/panel" style="color:var(--v)">dodaj pierwsze ogłoszenie</a>.</p>
    </div>
  {:else}
    <div class="grid">
      {#each visible as job (job.id)}
        <JobCard {job} />
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

<Footer>© 2026 BeautyKatalog · <a href="/">Katalog salonów</a></Footer>

<style>
  .hero {
    background: var(--card);
    border-bottom: 1px solid var(--line);
    padding: 3.5rem 0 2.5rem;
    color: var(--ink);
  }
  .eyebrow {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.6rem;
  }
  .hero h1 {
    font-size: clamp(1.8rem, 4vw, 2.7rem);
    margin-bottom: 0.5rem;
  }
  .lead {
    color: var(--ink-2);
    max-width: 500px;
    margin-bottom: 1.75rem;
    font-size: 0.98rem;
  }
  .search {
    display: flex;
    gap: 0.6rem;
    max-width: 560px;
    flex-wrap: wrap;
  }
  .search input {
    flex: 1;
    min-width: 200px;
    padding: 0.8rem 1.05rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-sm);
    font-size: 0.9rem;
    outline: none;
    background: var(--paper);
    color: var(--ink);
    transition: 0.15s;
  }
  .search input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(181, 83, 46, 0.12);
  }
  .filters {
    background: var(--card);
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 57px;
    z-index: 90;
  }
  .bar {
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .types {
    display: flex;
    gap: 0.35rem;
  }
  .types .bk-btn {
    background: #fff;
    color: var(--v);
    border: 1.5px solid var(--v);
  }
  .types .bk-btn.on {
    background: var(--v);
    color: #fff;
  }
  .count {
    font-size: 0.8rem;
    color: var(--muted);
    font-weight: 600;
    margin-left: auto;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.1rem;
  }
</style>
