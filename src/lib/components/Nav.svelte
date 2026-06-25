<script lang="ts">
  import { page } from '$app/state';

  const path = $derived(page.url.pathname);

  // §3: rozdzielenie świata zakupowego (klient) od zawodowego (branża)
  const industryPaths = ['/jobs', '/panel', '/admin'];
  const mode = $derived(
    industryPaths.some((p) => path === p || path.startsWith(p + '/')) || path === '/jobs'
      ? 'branza'
      : 'klient'
  );

  function isActive(href: string): boolean {
    return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
  }
</script>

<nav id="bk-nav" aria-label="BeautyKatalog nawigacja">
  <div class="bk-nav-inner">
    <a href="/" class="bk-logo">Beauty<span>Katalog</span></a>

    <div class="switch" role="tablist" aria-label="Tryb przeglądania">
      <a href="/" class="sw" class:on={mode === 'klient'} role="tab" aria-selected={mode === 'klient'}
        >Dla klienta</a
      >
      <a
        href="/jobs"
        class="sw"
        class:on={mode === 'branza'}
        role="tab"
        aria-selected={mode === 'branza'}>Dla branży</a
      >
    </div>

    <div class="bk-nav-links">
      {#if mode === 'klient'}
        <a href="/" class="bk-nav-link" class:active={isActive('/')}>Katalog salonów</a>
      {:else}
        <a href="/jobs" class="bk-nav-link" class:active={isActive('/jobs')}>Oferty pracy</a>
        <a href="/jobs/panel" class="bk-nav-link" class:active={isActive('/jobs/panel')}
          >Dodaj ogłoszenie</a
        >
      {/if}
    </div>

    {#if mode === 'klient'}
      <a href="/jobs" class="bk-nav-work">Praca w beauty</a>
    {/if}
    <a href="/panel" class="bk-nav-cta">Mój salon</a>
  </div>
</nav>

<style>
  .switch {
    display: inline-flex;
    border: 1px solid var(--line-strong);
    border-radius: 9999px;
    padding: 2px;
    flex-shrink: 0;
    background: var(--paper);
  }
  .sw {
    padding: 0.32rem 0.85rem;
    border-radius: 9999px;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--ink-2);
    white-space: nowrap;
    transition: 0.15s;
  }
  .sw:hover {
    color: var(--ink);
  }
  .sw.on {
    background: var(--ink);
    color: var(--card);
  }
  .bk-nav-work {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--accent);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .bk-nav-work:hover {
    color: var(--accent-d);
  }
  @media (max-width: 720px) {
    .bk-nav-work {
      display: none;
    }
    .sw {
      padding: 0.32rem 0.65rem;
      font-size: 0.75rem;
    }
  }
</style>
