<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import { formatLabel, trainingDate, seatsLabel } from '$lib/utils';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const tones = [
    'linear-gradient(150deg,#EBDAC2,#C9A98A)',
    'linear-gradient(150deg,#E7CFC6,#B98E7C)',
    'linear-gradient(150deg,#E4D2AE,#C6A15B)',
    'linear-gradient(150deg,#E9D8C2,#BFA07C)',
    'linear-gradient(150deg,#E9CEC9,#BC8E86)',
    'linear-gradient(150deg,#EAD9C4,#B79A86)'
  ];

  let activeCat = $state('');
  const categories = $derived([...new Set(data.trainings.map((t) => t.category).filter(Boolean))] as string[]);
  const visible = $derived(activeCat ? data.trainings.filter((t) => t.category === activeCat) : data.trainings);
</script>

<svelte:head>
  <title>Szkolenia beauty z certyfikacją — VELORA</title>
  <meta
    name="description"
    content="Katalog szkoleń beauty z certyfikacją: kosmetologia, fryzjerstwo, stylizacja rzęs, makijaż, manicure i barbering. Zapisz się online i płać wygodnie."
  />
</svelte:head>

<section class="sz-hero">
  <div class="sz-wrap">
    <span class="sz-eyebrow">Rozwój i certyfikacja</span>
    <h1 class="sz-h1">Szkolenia beauty <em>z certyfikatem</em></h1>
    <p class="sz-lead">Kursy prowadzone przez praktyków — stacjonarnie i online. Zapisz się w kilka kliknięć, zapłać kartą, BLIK-iem lub Przelewy24, a certyfikat trafi na Twoje konto.</p>
  </div>
</section>

<section class="sz-wrap sz-list">
  {#if categories.length}
    <div class="sz-filters">
      <button class="sz-chip" class:on={activeCat === ''} onclick={() => (activeCat = '')}>Wszystkie</button>
      {#each categories as c}
        <button class="sz-chip" class:on={activeCat === c} onclick={() => (activeCat = c)}>{c}</button>
      {/each}
    </div>
  {/if}

  {#if data.loadError}
    <div class="bk-empty"><h3>Nie udało się załadować szkoleń</h3><p>{data.loadError}</p></div>
  {:else if !visible.length}
    <div class="bk-empty"><h3>Brak szkoleń w tej kategorii</h3><p>Zajrzyj wkrótce — dodajemy nowe terminy.</p></div>
  {:else}
    <div class="sz-grid">
      {#each visible as t, i (t.id)}
        <a href="/szkolenia/{t.slug}" class="sz-card">
          <div class="sz-img" style="background:{t.cover_url ? `center/cover url(${t.cover_url})` : tones[i % tones.length]}">
            {#if t.category}<span class="sz-cat">{t.category}</span>{/if}
          </div>
          <div class="sz-body">
            <span class="sz-title">{t.title}</span>
            <span class="sz-meta">{formatLabel(t.format)} · {t.city ?? 'online'} · {trainingDate(t.event_date)}</span>
            <div class="sz-foot">
              <div class="sz-price"><span class="p">{t.price_pln} zł</span><span class="s">{seatsLabel(t.seats_total, t.seats_taken)}</span></div>
              <span class="sz-cta">Zapisz się</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<Footer>© 2026 VELORA · szkolenia beauty</Footer>

<style>
  .sz-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 clamp(20px, 4vw, 44px);
    width: 100%;
  }
  .sz-hero {
    background: linear-gradient(180deg, #fbf7f1, #f3ebe0);
    padding: clamp(40px, 6vw, 72px) 0;
    border-bottom: 1px solid var(--line);
  }
  .sz-eyebrow {
    display: block;
    font-size: 12px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--copper);
    font-weight: 600;
    margin-bottom: 14px;
  }
  .sz-h1 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(32px, 4.6vw, 52px);
    line-height: 1.05;
    color: var(--ink);
    margin: 0 0 14px;
  }
  .sz-h1 em {
    font-style: italic;
    color: var(--copper);
  }
  .sz-lead {
    max-width: 60ch;
    font-size: 16px;
    line-height: 1.6;
    color: var(--graphite);
    margin: 0;
  }
  .sz-list {
    padding-top: 32px;
    padding-bottom: 64px;
  }
  .sz-filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 26px;
  }
  .sz-chip {
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--porcelain);
    border: 1px solid var(--line-strong);
    color: var(--graphite);
    font-size: 13.5px;
    font-family: inherit;
    cursor: pointer;
    transition: 0.15s;
  }
  .sz-chip:hover {
    border-color: var(--ink);
    color: var(--ink);
  }
  .sz-chip.on {
    background: var(--ink);
    color: var(--porcelain);
    border-color: var(--ink);
    font-weight: 600;
  }
  .sz-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
  .sz-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: transform 0.25s, box-shadow 0.25s;
    display: flex;
    flex-direction: column;
    color: inherit;
  }
  .sz-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 50px rgba(32, 27, 23, 0.13);
  }
  .sz-img {
    aspect-ratio: 16 / 10;
    position: relative;
    background-size: cover;
    background-position: center;
  }
  .sz-cat {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(251, 247, 241, 0.92);
    border-radius: 999px;
    padding: 4px 11px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--premium-fg);
    text-transform: uppercase;
  }
  .sz-body {
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }
  .sz-title {
    font-family: var(--serif);
    font-size: 18px;
    line-height: 1.25;
    color: var(--ink);
  }
  .sz-meta {
    font-size: 13px;
    color: var(--ink-3);
  }
  .sz-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid var(--line);
    gap: 10px;
  }
  .sz-price {
    display: flex;
    flex-direction: column;
  }
  .sz-price .p {
    font-size: 16px;
    font-weight: 700;
    color: var(--ink);
  }
  .sz-price .s {
    font-size: 11.5px;
    color: var(--copper);
  }
  .sz-cta {
    border: none;
    background: var(--ink);
    color: var(--porcelain);
    font-size: 13px;
    font-weight: 600;
    padding: 9px 16px;
    border-radius: 999px;
    white-space: nowrap;
    transition: background 0.18s;
  }
  .sz-card:hover .sz-cta {
    background: var(--copper);
  }
  @media (max-width: 1023px) {
    .sz-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 560px) {
    .sz-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
