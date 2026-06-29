<script lang="ts">
  import { onMount } from 'svelte';
  import { priceLabel, hoursToText, starString, priceTier } from '$lib/utils';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';
  import type { Service } from '$lib/database.types';

  let { data }: PageProps = $props();

  const salon = $derived(data.salon);
  let lightbox = $state('');
  let copied = $state(false);

  let mapEl = $state<HTMLDivElement>();
  let L: any = null;

  const photos = $derived(
    (salon.gallery_assets ?? [])
      .filter((p) => p.is_active !== false && p.public_url)
      .slice()
      .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
  );
  const lead = $derived(photos[0] ?? null);
  const thumbs = $derived(photos.slice(1, 5));
  const extraCount = $derived(Math.max(0, photos.length - 5));

  const services = $derived((salon.services ?? []).filter((s) => s.is_active !== false));

  // Cennik pogrupowany kategoriami (§9.3)
  const grouped = $derived.by(() => {
    const byCat = new Map<string, { name: string; items: Service[] }>();
    const catName = (id: number | null) =>
      data.categories.find((c) => c.id === id)?.name ?? 'Pozostałe';
    for (const sv of services) {
      const key = String(sv.category_id ?? 'inne');
      if (!byCat.has(key)) byCat.set(key, { name: catName(sv.category_id), items: [] });
      byCat.get(key)!.items.push(sv);
    }
    return [...byCat.values()];
  });

  const tier = $derived(priceTier(services.map((s) => s.price_from)));

  // JSON-LD BeautySalon (SEO / Google rich results)
  const canonical = $derived(`${data.origin}/salon/${salon.id}`);
  const salonLd = $derived.by(() => {
    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org/',
      '@type': 'BeautySalon',
      name: salon.name,
      url: canonical
    };
    const desc = salon.short_description || salon.description;
    if (desc) ld.description = desc;
    const img = photos[0]?.public_url || salon.cover_image_url;
    if (img) ld.image = img;
    if (salon.phone) ld.telephone = salon.phone;
    if (salon.email) ld.email = salon.email;
    if (salon.website_url) ld.sameAs = salon.website_url;
    if (salon.city || salon.address_line) {
      ld.address = {
        '@type': 'PostalAddress',
        streetAddress: salon.address_line ?? undefined,
        postalCode: salon.postal_code ?? undefined,
        addressLocality: salon.city ?? undefined,
        addressRegion: salon.voivodeship ?? undefined,
        addressCountry: 'PL'
      };
    }
    if (salon.latitude != null && salon.longitude != null) {
      ld.geo = { '@type': 'GeoCoordinates', latitude: salon.latitude, longitude: salon.longitude };
    }
    if (tier > 0) ld.priceRange = '$'.repeat(tier);
    if (reviewCount > 0) {
      ld.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Math.round(avgRating * 10) / 10,
        reviewCount
      };
    }
    return JSON.stringify(ld).replace(/</g, '\\u003c');
  });

  // Oceny (na poziomie salonu — reviews.salon_id)
  const reviews = $derived(data.reviews);
  const reviewCount = $derived(reviews.length);
  const avgRating = $derived(
    reviewCount ? reviews.reduce((a, r) => a + r.rating, 0) / reviewCount : 0
  );
  const distribution = $derived(
    [5, 4, 3, 2, 1].map((star) => ({
      star,
      n: reviews.filter((r) => r.rating === star).length
    }))
  );

  const hoursLines = $derived(hoursToText(salon.opening_hours).split('\n').filter(Boolean));
  const socials = $derived(
    [
      salon.instagram_url && { label: 'Instagram', url: salon.instagram_url },
      salon.facebook_url && { label: 'Facebook', url: salon.facebook_url },
      salon.tiktok_url && { label: 'TikTok', url: salon.tiktok_url }
    ].filter((s): s is { label: string; url: string } => Boolean(s))
  );

  const bookHref = $derived(
    salon.phone ? `tel:${salon.phone}` : salon.email ? `mailto:${salon.email}` : '#kontakt'
  );

  async function share() {
    const url = typeof location !== 'undefined' ? location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: salon.name, url });
      } catch {
        /* anulowano */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }

  onMount(async () => {
    if (salon.latitude && salon.longitude) {
      L = (await import('leaflet')).default;
      initMap();
    }
  });

  function initMap() {
    if (!L || !mapEl || !salon.latitude || !salon.longitude) return;
    const map = L.map(mapEl, { zoomControl: true, scrollWheelZoom: false }).setView(
      [salon.latitude, salon.longitude],
      15
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(map);
    L.marker([salon.latitude, salon.longitude])
      .addTo(map)
      .bindPopup(`<b>${salon.name}</b><br>${salon.city}`);
  }
</script>

<svelte:head>
  <title>{salon.name} — BeautyKatalog</title>
  <meta
    name="description"
    content={salon.short_description || salon.description || `Profil salonu ${salon.name}`}
  />
  <link rel="canonical" href={canonical} />
  {@html `<scr` + `ipt type="application/ld+json">${salonLd}</scr` + `ipt>`}
</svelte:head>

<div class="bk-container">
  <nav class="crumb"><a href="/">Katalog salonów</a> <span>/</span> {salon.name}</nav>
</div>

<!-- GALERIA — zdjęcia prowadzą (§4, §9.3) -->
{#if photos.length}
  <div class="bk-container">
    <div class="gallery" class:single={photos.length === 1}>
      <button class="lead" onclick={() => (lightbox = lead?.public_url ?? '')}>
        <img src={lead?.public_url} alt={salon.name} />
      </button>
      {#if thumbs.length}
        <div class="thumbs">
          {#each thumbs as t, i}
            <button
              class="thumb"
              onclick={() => (lightbox = t.public_url ?? '')}
              aria-label="Zdjęcie {i + 2}"
            >
              <img src={t.public_url} alt="Zdjęcie salonu" loading="lazy" />
              {#if i === thumbs.length - 1 && extraCount > 0}
                <span class="more-overlay">+{extraCount} zdjęć</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- BLOK NAGŁÓWKA -->
<header class="bk-container head">
  <div class="head-main">
    <h1>{salon.name}</h1>
    <div class="meta">
      {#if reviewCount}
        <span class="rating">
          <span class="bk-stars">{starString(avgRating)}</span>
          <strong>{avgRating.toFixed(1)}</strong>
          <span class="rcount">({reviewCount})</span>
        </span>
        <span class="dot">·</span>
      {/if}
      {#if salon.city}<span>{salon.city}{salon.address_line ? `, ${salon.address_line}` : ''}</span>{/if}
      {#if tier}
        <span class="dot">·</span>
        <span class="tier">
          {#each [1, 2, 3] as t}<span class:on={t <= tier}>zł</span>{#if t < 3}<i>·</i>{/if}{/each}
        </span>
      {/if}
    </div>
    {#if salon.short_description}<p class="lead-tag">{salon.short_description}</p>{/if}
  </div>
  <div class="head-actions">
    <a href={bookHref} class="bk-btn bk-btn-primary book">Umów wizytę</a>
    <button class="bk-btn bk-btn-outline" onclick={share}>{copied ? '✓ Skopiowano' : '↗ Udostępnij'}</button>
  </div>
</header>

<!-- PASEK SZYBKICH FAKTÓW -->
<div class="bk-container facts">
  {#if hoursLines.length}<span>🕐 {hoursLines[0]}</span>{/if}
  {#if salon.address_line || salon.city}<span>📍 {salon.address_line ? `${salon.address_line}, ` : ''}{salon.city}</span>{/if}
  {#if salon.phone}<a href="tel:{salon.phone}">📞 {salon.phone}</a>{/if}
</div>

<!-- GŁÓWNA TREŚĆ -->
<main class="bk-container layout">
  <div>
    {#if salon.description}
      <section class="block">
        <h2>O salonie</h2>
        <p class="desc">{salon.description}</p>
      </section>
    {/if}

    <section class="block" id="cennik">
      <h2>Cennik zabiegów</h2>
      {#if services.length === 0}
        <p class="muted">Salon nie dodał jeszcze listy zabiegów.</p>
      {:else}
        {#each grouped as group}
          <h3 class="cat">{group.name}</h3>
          <div class="svc-list">
            {#each group.items as sv}
              <div class="svc-row">
                <div class="svc-info">
                  <p class="svc-name">{sv.name}</p>
                  {#if sv.duration_min}<p class="svc-dur">⏱ {sv.duration_min} min</p>{/if}
                </div>
                {#if priceLabel(sv.price_from, sv.price_to)}
                  <span class="svc-price">{priceLabel(sv.price_from, sv.price_to)}</span>
                {/if}
                {#if salon.phone || salon.email}
                  <a href={bookHref} class="bk-btn bk-btn-outline svc-cta">Umów</a>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      {/if}
    </section>

    {#if data.team.length}
      <section class="block">
        <h2>Zespół</h2>
        <div class="team">
          {#each data.team as member}
            <a class="member" href="/specjalista/{member.id}">
              <div class="m-avatar">
                {#if member.photo_url}
                  <img src={member.photo_url} alt={member.name} loading="lazy" />
                {:else}
                  <span>{member.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}</span>
                {/if}
              </div>
              <p class="m-name">{member.name}</p>
              {#if member.role_label}<p class="m-role">{member.role_label}</p>{/if}
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <section class="block">
      <h2>Opinie</h2>
      {#if reviewCount === 0}
        <p class="muted">Ten salon nie ma jeszcze opinii.</p>
      {:else}
        <div class="rev-summary">
          <div class="rev-score">
            <strong>{avgRating.toFixed(1)}</strong>
            <span class="bk-stars">{starString(avgRating)}</span>
            <span class="muted">{reviewCount}{' '}{reviewCount === 1 ? 'opinia' : 'opinii'}</span>
          </div>
          <div class="rev-dist">
            {#each distribution as d}
              <div class="dist-row">
                <span class="dist-star">{d.star}★</span>
                <span class="dist-bar"><span style="width:{reviewCount ? (d.n / reviewCount) * 100 : 0}%"></span></span>
                <span class="dist-n">{d.n}</span>
              </div>
            {/each}
          </div>
        </div>
        <div class="rev-list">
          {#each reviews as r}
            <div class="rev">
              <div class="rev-head">
                <span class="rev-author">{r.author_name}</span>
                <span class="bk-stars">{starString(r.rating)}</span>
              </div>
              {#if r.content}<p class="rev-body">{r.content}</p>{/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <aside class="side">
    <div class="bk-card pad" id="kontakt">
      <h3>Kontakt</h3>
      <div class="contact">
        {#if salon.phone}<a href="tel:{salon.phone}" class="c-link"><span>📞</span>{salon.phone}</a>{/if}
        {#if salon.email}<a href="mailto:{salon.email}" class="c-link"><span>✉️</span>{salon.email}</a>{/if}
        {#if salon.website_url}<a href={salon.website_url} target="_blank" rel="noopener" class="c-link c-www"><span>🌐</span>Strona WWW</a>{/if}
        {#if salon.address_line}<p class="c-link c-addr"><span>📍</span><span>{salon.address_line}, {salon.city}{salon.postal_code ? ` ${salon.postal_code}` : ''}</span></p>{/if}
      </div>
      {#if socials.length}
        <div class="socials">
          {#each socials as s, i}
            <a href={s.url} target="_blank" rel="noopener">{s.label}</a>{#if i < socials.length - 1}<span> · </span>{/if}
          {/each}
        </div>
      {/if}
    </div>

    {#if hoursLines.length}
      <div class="bk-card pad">
        <h3>Godziny otwarcia</h3>
        <div class="hours">
          {#each hoursLines as line}<p>{line}</p>{/each}
        </div>
      </div>
    {/if}

    {#if salon.latitude && salon.longitude}
      <div class="bk-card map-card">
        <div bind:this={mapEl} class="map"></div>
        <div class="map-foot">
          <a
            href="https://www.google.com/maps/search/?api=1&query={salon.latitude},{salon.longitude}"
            target="_blank"
            rel="noopener">Otwórz w Google Maps →</a
          >
        </div>
      </div>
    {/if}
  </aside>
</main>

<!-- STICKY CTA (mobile) -->
<div class="sticky-cta">
  <a href={bookHref} class="bk-btn bk-btn-primary">Umów wizytę</a>
</div>

<!-- LIGHTBOX -->
{#if lightbox}
  <div class="lightbox" role="presentation" onclick={() => (lightbox = '')}>
    <img src={lightbox} alt="" />
  </div>
{/if}

<Footer>© 2026 BeautyKatalog by Aura Consulting · <a href="/">← Wróć do katalogu</a></Footer>

<style>
  .crumb {
    font-size: 0.82rem;
    color: var(--ink-3);
    padding: 1.1rem 0 0.9rem;
  }
  .crumb a {
    color: var(--ink-2);
  }
  .crumb a:hover {
    color: var(--accent);
  }
  .crumb span {
    margin: 0 0.3rem;
  }

  /* GALERIA */
  .gallery {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 0.6rem;
    height: 380px;
  }
  .gallery.single {
    grid-template-columns: 1fr;
  }
  .lead,
  .thumb {
    border: none;
    padding: 0;
    border-radius: var(--r);
    overflow: hidden;
    cursor: pointer;
    background: var(--blush);
  }
  .lead {
    height: 100%;
  }
  .lead img,
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s;
  }
  .lead:hover img,
  .thumb:hover img {
    transform: scale(1.02);
  }
  .thumbs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 0.6rem;
  }
  .thumb {
    position: relative;
    height: 100%;
  }
  .more-overlay {
    position: absolute;
    inset: 0;
    background: rgba(43, 39, 36, 0.55);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-size: 1.05rem;
    font-weight: 500;
  }

  /* NAGŁÓWEK */
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    padding-top: 1.6rem;
  }
  .head h1 {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    margin-bottom: 0.5rem;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.9rem;
    color: var(--ink-2);
  }
  .rating {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .rating strong {
    font-weight: 500;
    color: var(--ink);
  }
  .rcount {
    color: var(--ink-3);
  }
  .dot {
    color: var(--ink-3);
  }
  .tier {
    letter-spacing: 0.05em;
  }
  .tier span {
    color: var(--line-strong);
  }
  .tier span.on {
    color: var(--ink);
  }
  .tier i {
    color: var(--ink-3);
    font-style: normal;
    margin: 0 0.1rem;
  }
  .lead-tag {
    margin-top: 0.7rem;
    font-family: var(--serif);
    font-size: 1.05rem;
    color: var(--ink-2);
    max-width: 560px;
  }
  .head-actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  /* FAKTY */
  .facts {
    display: flex;
    gap: 1.4rem;
    flex-wrap: wrap;
    padding-top: 1.1rem;
    padding-bottom: 0.4rem;
    font-size: 0.85rem;
    color: var(--ink-2);
    border-bottom: 1px solid var(--line);
    margin-bottom: 0.5rem;
  }
  .facts a {
    color: var(--ink-2);
  }
  .facts a:hover {
    color: var(--accent);
  }

  /* LAYOUT */
  .layout {
    padding-top: 1.75rem;
    padding-bottom: 4.5rem;
    display: grid;
    grid-template-columns: 1fr minmax(0, 340px);
    gap: 2.5rem;
    align-items: start;
  }
  .block {
    margin-bottom: 2.5rem;
  }
  .block h2 {
    font-size: 1.5rem;
    margin-bottom: 1.1rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--line);
  }
  .muted {
    color: var(--ink-3);
    font-size: 0.9rem;
  }
  .desc {
    color: var(--ink-2);
    line-height: 1.75;
    font-size: 0.95rem;
    white-space: pre-line;
  }

  /* CENNIK */
  .cat {
    font-size: 0.78rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
    margin: 1.4rem 0 0.6rem;
  }
  .cat:first-of-type {
    margin-top: 0;
  }
  .svc-list {
    display: flex;
    flex-direction: column;
  }
  .svc-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid var(--line);
  }
  .svc-info {
    flex: 1;
  }
  .svc-name {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink);
  }
  .svc-dur {
    font-size: 0.78rem;
    color: var(--ink-3);
    margin-top: 0.1rem;
  }
  .svc-price {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
  }
  .svc-cta {
    padding: 0.4rem 1rem;
    font-size: 0.82rem;
  }

  /* ZESPÓŁ */
  .team {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1.25rem;
  }
  .member {
    text-align: center;
    color: inherit;
    display: block;
  }
  .member:hover .m-avatar {
    border-color: var(--accent);
  }
  .member:hover .m-name {
    color: var(--accent);
  }
  .m-avatar {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 0.6rem;
    background: var(--blush);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
  }
  .m-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .m-avatar span {
    font-family: var(--serif);
    font-size: 1.4rem;
    color: var(--accent-d);
  }
  .m-name {
    font-size: 0.9rem;
    font-weight: 500;
  }
  .m-role {
    font-size: 0.78rem;
    color: var(--ink-3);
  }

  /* OPINIE */
  .rev-summary {
    display: flex;
    gap: 2rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .rev-score {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }
  .rev-score strong {
    font-family: var(--serif);
    font-size: 2.6rem;
    font-weight: 500;
    line-height: 1;
  }
  .rev-dist {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .dist-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.8rem;
    color: var(--ink-3);
  }
  .dist-star {
    width: 1.8rem;
  }
  .dist-bar {
    flex: 1;
    height: 6px;
    background: var(--blush);
    border-radius: 3px;
    overflow: hidden;
  }
  .dist-bar span {
    display: block;
    height: 100%;
    background: var(--gold);
  }
  .dist-n {
    width: 1.4rem;
    text-align: right;
  }
  .rev-list {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .rev {
    border-top: 1px solid var(--line);
    padding-top: 1.1rem;
  }
  .rev-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.35rem;
  }
  .rev-author {
    font-weight: 500;
    font-size: 0.92rem;
  }
  .rev-body {
    font-size: 0.9rem;
    color: var(--ink-2);
    line-height: 1.65;
  }

  /* SIDEBAR */
  .side {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: sticky;
    top: 80px;
  }
  .pad {
    padding: 1.25rem;
  }
  .side h3 {
    font-size: 1.05rem;
    margin-bottom: 0.9rem;
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
    font-size: 0.88rem;
    color: var(--ink);
  }
  .c-link span:first-child {
    font-size: 1.05rem;
  }
  .c-www {
    color: var(--accent);
  }
  .c-addr {
    align-items: flex-start;
    color: var(--ink-2);
  }
  .socials {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  .socials a {
    color: var(--accent);
    font-weight: 500;
    font-size: 0.85rem;
  }
  .hours {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .hours p {
    font-size: 0.88rem;
    color: var(--ink-2);
  }
  .map-card {
    overflow: hidden;
  }
  .map {
    height: 220px;
  }
  .map-foot {
    padding: 0.75rem 1rem;
  }
  .map-foot a {
    font-size: 0.82rem;
    color: var(--accent);
    font-weight: 500;
  }

  /* STICKY CTA — mobile (§7) */
  .sticky-cta {
    display: none;
  }
  .sticky-cta .bk-btn {
    width: 100%;
    justify-content: center;
    padding: 0.85rem;
  }

  /* LIGHTBOX */
  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(43, 39, 36, 0.92);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 1.5rem;
  }
  .lightbox img {
    max-width: 92vw;
    max-height: 90vh;
    border-radius: var(--r);
    object-fit: contain;
  }

  @media (max-width: 768px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .side {
      position: static;
    }
    .gallery {
      height: 300px;
    }
    .head-actions .book {
      display: none;
    }
    .sticky-cta {
      display: block;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 120;
      background: var(--card);
      border-top: 1px solid var(--line);
      padding: 0.7rem 1rem;
    }
  }
  @media (max-width: 520px) {
    .gallery {
      grid-template-columns: 1fr;
      height: auto;
    }
    .lead {
      height: 240px;
    }
    .thumbs {
      grid-template-rows: 80px;
      grid-auto-rows: 80px;
    }
  }
</style>
