<script lang="ts">
  import { onMount } from 'svelte';
  import { priceLabel, hoursToText } from '$lib/utils';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';
  import type { SalonService } from '$lib/database.types';

  let { data }: PageProps = $props();

  const salon = $derived(data.salon);
  let lightbox = $state('');

  let mapEl = $state<HTMLDivElement>();
  let L: any = null;

  const photos = $derived(
    (salon.salon_photos ?? [])
      .slice()
      .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
  );
  const cover = $derived(photos.find((p) => p.is_cover) ?? photos[0]);
  const services = $derived(salon.salon_services ?? []);
  const available = $derived(services.filter((s) => s.is_available !== false));
  const unavailable = $derived(services.filter((s) => s.is_available === false));
  const hoursLines = $derived(hoursToText(salon.opening_hours).split('\n').filter(Boolean));
  const socials = $derived(
    [
      salon.instagram_url && { label: 'Instagram', url: salon.instagram_url },
      salon.facebook_url && { label: 'Facebook', url: salon.facebook_url },
      salon.tiktok_url && { label: 'TikTok', url: salon.tiktok_url }
    ].filter((s): s is { label: string; url: string } => Boolean(s))
  );

  onMount(async () => {
    if (salon.lat && salon.lng) {
      L = (await import('leaflet')).default;
      initMap();
    }
  });

  function initMap() {
    if (!L || !mapEl || !salon.lat || !salon.lng) return;
    const map = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false }).setView(
      [salon.lat, salon.lng],
      15
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);
    L.marker([salon.lat, salon.lng]).addTo(map).bindPopup(`<b>${salon.name}</b><br>${salon.city}`);
  }
</script>

<svelte:head>
  <title>{salon.name} — BeautyKatalog</title>
  <meta name="description" content={salon.tagline || salon.description || `Profil salonu ${salon.name}`} />
</svelte:head>

<!-- HERO -->
<div class="hero">
  <div class="bk-container">
    <a href="/" class="back">← Katalog salonów</a>
    <div class="hero-row">
      <div class="avatar">
        {#if cover}
          <img src={cover.url} alt={salon.name} />
        {:else}
          <div class="avatar-ph">💅</div>
        {/if}
      </div>
      <div style="flex:1;min-width:200px">
        <h1>{salon.name}</h1>
        <p class="hero-loc">
          📍 {salon.city}{salon.street ? `, ${salon.street}` : ''}{salon.postal_code ? ` ${salon.postal_code}` : ''}
        </p>
        {#if salon.tagline}<p class="hero-tag">{salon.tagline}</p>{/if}
      </div>
    </div>
  </div>
</div>

<!-- GALERIA -->
{#if photos.length}
  <div class="gallery">
    <div class="bk-container gallery-row">
      {#each photos as p}
        <button class="gallery-item" style="width:{photos.length === 1 ? '100%' : '220px'}" onclick={() => (lightbox = p.url)}>
          <img src={p.url} alt="Zdjęcie salonu" loading="lazy" />
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- GŁÓWNA TREŚĆ -->
<main class="bk-container layout">
  <div>
    {#if salon.description}
      <section class="bk-card block">
        <h2>O salonie</h2>
        <p class="desc">{salon.description}</p>
      </section>
    {/if}

    <section class="bk-card block">
      <h2>Zabiegi i usługi <span class="bk-badge" style="margin-left:.5rem">{services.length}</span></h2>
      {#if services.length === 0}
        <p style="color:var(--muted);font-size:.875rem">Salon nie dodał jeszcze listy zabiegów.</p>
      {:else}
        <div class="svc-list">
          {#each available as sv}
            {@render serviceRow(sv, false)}
          {/each}
          {#if unavailable.length}
            <p class="svc-divider">Tymczasowo niedostępne</p>
            {#each unavailable as sv}
              {@render serviceRow(sv, true)}
            {/each}
          {/if}
        </div>
      {/if}
    </section>
  </div>

  <div class="side">
    <!-- KONTAKT -->
    <div class="bk-card" style="padding:1.25rem">
      <h3>Kontakt</h3>
      <div class="contact">
        {#if salon.phone}<a href="tel:{salon.phone}" class="c-link"><span>📞</span>{salon.phone}</a>{/if}
        {#if salon.email_contact}<a href="mailto:{salon.email_contact}" class="c-link"><span>✉️</span>{salon.email_contact}</a>{/if}
        {#if salon.website}<a href={salon.website} target="_blank" rel="noopener" class="c-link c-www"><span>🌐</span>Strona WWW</a>{/if}
        {#if salon.street}<p class="c-link c-addr"><span>📍</span><span>{salon.street}, {salon.city}{salon.postal_code ? ` ${salon.postal_code}` : ''}</span></p>{/if}
      </div>
      {#if socials.length}
        <div class="socials">
          {#each socials as s, i}
            <a href={s.url} target="_blank" rel="noopener">{s.label}</a>{#if i < socials.length - 1}<span> · </span>{/if}
          {/each}
        </div>
      {/if}
    </div>

    <!-- GODZINY -->
    {#if hoursLines.length}
      <div class="bk-card" style="padding:1.25rem">
        <h3>🕐 Godziny otwarcia</h3>
        <div style="display:flex;flex-direction:column;gap:.2rem">
          {#each hoursLines as line}<p style="font-size:.875rem;color:var(--muted)">{line}</p>{/each}
        </div>
      </div>
    {/if}

    <!-- MAPA -->
    {#if salon.lat && salon.lng}
      <div class="bk-card" style="overflow:hidden">
        <div bind:this={mapEl} style="height:220px"></div>
        <div style="padding:.75rem 1rem">
          <a
            href="https://www.google.com/maps/search/?api=1&query={salon.lat},{salon.lng}"
            target="_blank"
            rel="noopener"
            style="font-size:.8rem;color:var(--v);font-weight:700">Otwórz w Google Maps →</a
          >
        </div>
      </div>
    {/if}

    <!-- CTA -->
    {#if salon.phone || salon.email_contact}
      <div class="bk-card cta">
        <p>Umów wizytę</p>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          {#if salon.phone}<a href="tel:{salon.phone}" class="bk-btn bk-btn-primary" style="width:100%;justify-content:center">📞 Zadzwoń</a>{/if}
          {#if salon.email_contact}<a href="mailto:{salon.email_contact}" class="bk-btn bk-btn-outline" style="width:100%;justify-content:center">✉️ Napisz email</a>{/if}
        </div>
      </div>
    {/if}
  </div>
</main>

<!-- LIGHTBOX -->
{#if lightbox}
  <div class="lightbox" role="presentation" onclick={() => (lightbox = '')}>
    <img src={lightbox} alt="" />
  </div>
{/if}

<Footer>© 2026 BeautyKatalog by Aura Consulting · <a href="/">← Wróć do katalogu</a></Footer>

{#snippet serviceRow(sv: SalonService, dimmed: boolean)}
  <div class="svc-row" class:dimmed>
    <div>
      <p class="svc-name">{sv.service_name}</p>
      {#if sv.duration_min}<p class="svc-dur">⏱ {sv.duration_min} min</p>{/if}
    </div>
    {#if priceLabel(sv.price_from, sv.price_to)}
      <span class="svc-price">{priceLabel(sv.price_from, sv.price_to)}</span>
    {/if}
  </div>
{/snippet}

<style>
  .hero {
    background: linear-gradient(135deg, #3b0764, #7c3aed);
    color: #fff;
    padding: 2.5rem 0 0;
  }
  .back {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 600;
    display: inline-block;
    margin-bottom: 1rem;
  }
  .hero-row {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding-bottom: 2rem;
  }
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 1rem;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.1);
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar-ph {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 2rem;
  }
  .hero h1 {
    font-size: clamp(1.5rem, 4vw, 2.2rem);
    margin-bottom: 0.3rem;
  }
  .hero-loc {
    opacity: 0.8;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
  }
  .hero-tag {
    opacity: 0.9;
    font-style: italic;
    font-size: 0.95rem;
  }
  .gallery {
    background: #1e1b4b;
    padding: 0.75rem 0;
  }
  .gallery-row {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 0.25rem;
  }
  .gallery-item {
    flex-shrink: 0;
    height: 160px;
    border: none;
    padding: 0;
    border-radius: 0.75rem;
    overflow: hidden;
    cursor: pointer;
    background: none;
  }
  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: 0.2s;
  }
  .gallery-item:hover img {
    transform: scale(1.03);
  }
  .layout {
    padding-top: 2rem;
    padding-bottom: 3rem;
    display: grid;
    grid-template-columns: 1fr minmax(0, 340px);
    gap: 2rem;
    align-items: start;
  }
  .block {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .block h2 {
    font-size: 1.05rem;
    margin-bottom: 0.75rem;
  }
  .desc {
    color: var(--muted);
    line-height: 1.7;
    font-size: 0.9rem;
    white-space: pre-line;
  }
  .svc-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .svc-divider {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.75rem;
  }
  .svc-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--white);
    border: 1px solid var(--border);
  }
  .svc-row.dimmed {
    background: #f8fafc;
    opacity: 0.55;
  }
  .svc-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--navy);
  }
  .svc-dur {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .svc-price {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--v);
    flex-shrink: 0;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .side h3 {
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
  .contact {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .c-link {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.875rem;
    color: var(--navy);
    font-weight: 600;
  }
  .c-link span:first-child {
    font-size: 1.1rem;
  }
  .c-www {
    color: var(--v);
  }
  .c-addr {
    align-items: flex-start;
    color: var(--muted);
    font-weight: 400;
  }
  .socials {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  .socials a {
    color: var(--v);
    font-weight: 700;
    font-size: 0.85rem;
  }
  .cta {
    padding: 1.25rem;
    background: var(--vl);
    border-color: var(--v);
  }
  .cta p {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--vd);
    margin-bottom: 0.75rem;
  }
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .lightbox img {
    max-width: 90vw;
    max-height: 90vh;
    border-radius: 0.5rem;
    object-fit: contain;
  }
  @media (max-width: 768px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
