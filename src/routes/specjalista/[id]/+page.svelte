<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const s = $derived(data.specialist);
  const salon = $derived(s.salon);

  const initials = $derived(
    s.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
  );

  const bookHref = $derived(
    salon?.phone ? `tel:${salon.phone}` : salon?.email ? `mailto:${salon.email}` : '#'
  );
</script>

<svelte:head>
  <title>{s.name}{s.role_label ? ` — ${s.role_label}` : ''} — BeautyKatalog</title>
  <meta
    name="description"
    content={s.bio || `${s.name}${s.role_label ? `, ${s.role_label}` : ''}${salon ? ` w ${salon.name}` : ''}`}
  />
</svelte:head>

<div class="bk-container">
  <nav class="crumb">
    <a href="/">Katalog</a> <span>/</span>
    {#if salon}<a href="/salon/{salon.id}">{salon.name}</a> <span>/</span>{/if}
    {s.name}
  </nav>
</div>

<header class="bk-container head">
  <div class="avatar">
    {#if s.photo_url}
      <img src={s.photo_url} alt={s.name} />
    {:else}
      <span class="initials">{initials}</span>
    {/if}
  </div>
  <div class="head-info">
    <h1>{s.name}</h1>
    <p class="role">
      {#if s.role_label}{s.role_label}{/if}{#if s.role_label && salon}{' · '}{/if}{#if salon}<a
          href="/salon/{salon.id}">{salon.name}</a
        >{salon.city ? `, ${salon.city}` : ''}{/if}
    </p>
    <div class="actions">
      {#if bookHref !== '#'}
        <a href={bookHref} class="bk-btn bk-btn-primary">Umów wizytę</a>
      {/if}
      {#if salon?.email}
        <a href="mailto:{salon.email}" class="bk-btn bk-btn-outline">Napisz</a>
      {/if}
    </div>
  </div>
</header>

<main class="bk-container body">
  {#if s.bio}
    <section class="block">
      <h2>O mnie</h2>
      <p class="bio">{s.bio}</p>
    </section>
  {/if}

  {#if salon}
    <section class="block">
      <h2>Salon</h2>
      <a href="/salon/{salon.id}" class="bk-card salon-link">
        <div>
          <p class="sl-name">{salon.name}</p>
          {#if salon.city}<p class="sl-city">{salon.city}</p>{/if}
        </div>
        <span class="sl-arrow">Zobacz profil salonu →</span>
      </a>
    </section>
  {/if}
</main>

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

  .head {
    display: flex;
    gap: 1.75rem;
    align-items: center;
    flex-wrap: wrap;
    padding-top: 1.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--line);
  }
  .avatar {
    width: 132px;
    height: 132px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--blush);
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .initials {
    font-family: var(--serif);
    font-size: 2.6rem;
    font-weight: 500;
    color: var(--accent-d);
  }
  .head-info {
    flex: 1;
    min-width: 240px;
  }
  .head h1 {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    margin-bottom: 0.4rem;
  }
  .role {
    font-size: 1rem;
    color: var(--ink-2);
    margin-bottom: 1.1rem;
  }
  .role a {
    color: var(--accent);
  }
  .actions {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .body {
    padding-top: 2rem;
    padding-bottom: 4rem;
    max-width: 760px;
  }
  .block {
    margin-bottom: 2.5rem;
  }
  .block h2 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--line);
  }
  .bio {
    font-family: var(--serif);
    font-size: 1.1rem;
    line-height: 1.7;
    color: var(--ink-2);
    white-space: pre-line;
  }
  .salon-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.1rem 1.25rem;
    flex-wrap: wrap;
    transition: border-color 0.2s;
  }
  .salon-link:hover {
    border-color: var(--line-strong);
  }
  .sl-name {
    font-weight: 500;
    font-size: 1.05rem;
  }
  .sl-city {
    font-size: 0.85rem;
    color: var(--ink-3);
  }
  .sl-arrow {
    color: var(--accent);
    font-size: 0.88rem;
    font-weight: 500;
  }
</style>
