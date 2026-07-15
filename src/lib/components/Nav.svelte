<script lang="ts">
  import { page } from '$app/state';

  const path = $derived(page.url.pathname);

  function isActive(href: string): boolean {
    return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
  }
</script>

<nav id="bk-nav" aria-label="VELORA — nawigacja">
  <div class="bk-nav-inner">
    <a href="/" class="vel-wordmark" aria-label="VELORA — strona główna">
      <span class="vel-mono" aria-hidden="true">V</span>
      <span class="vel-name">VELORA</span>
    </a>

    <div class="vel-links">
      <a href="/" class="vel-link" class:active={isActive('/')}>Salony</a>
      <a href="/jobs" class="vel-link" class:active={isActive('/jobs')}>Praca</a>
      <a href="/#szkolenia" class="vel-link">Szkolenia</a>
      <a href="/panel" class="vel-link" class:active={isActive('/panel')}>Dla salonów</a>
    </div>

    <div class="vel-actions">
      <a href="/panel" class="vel-login">Zaloguj</a>
      <a href="/panel" class="bk-nav-cta">Dołącz</a>
    </div>
  </div>
</nav>

<!-- Dolny pasek nawigacji (mobile <768) -->
<nav class="vel-tabbar" aria-label="Nawigacja mobilna">
  <a href="/" class="vel-tab" class:on={isActive('/')}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l1-4h16l1 4"/><path d="M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9"/><path d="M4 9a2.5 2.5 0 004 0 2.5 2.5 0 004 0 2.5 2.5 0 004 0 2.5 2.5 0 004 0"/></svg>
    <span>Salony</span>
  </a>
  <a href="/jobs" class="vel-tab" class:on={isActive('/jobs')}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M3 12h18"/></svg>
    <span>Praca</span>
  </a>
  <a href="/#szkolenia" class="vel-tab">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5"/></svg>
    <span>Szkolenia</span>
  </a>
  <a href="/panel" class="vel-tab" class:on={isActive('/panel')}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg>
    <span>Konto</span>
  </a>
</nav>

<style>
  /* WORDMARK */
  .vel-wordmark {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  .vel-mono {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-size: 19px;
    color: var(--copper);
    line-height: 1;
    flex-shrink: 0;
  }
  .vel-name {
    font-family: var(--serif);
    font-size: 22px;
    letter-spacing: 0.16em;
    color: var(--ink);
  }

  /* LINKS (desktop) */
  .vel-links {
    display: flex;
    align-items: center;
    gap: 30px;
    margin: 0 auto;
  }
  .vel-link {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--graphite);
    transition: color 0.15s;
    white-space: nowrap;
  }
  .vel-link:hover {
    color: var(--ink);
  }
  .vel-link.active {
    color: var(--ink);
    font-weight: 600;
  }

  /* ACTIONS */
  .vel-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  .vel-login {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
    white-space: nowrap;
  }
  .vel-login:hover {
    color: var(--copper);
  }

  /* MOBILE BOTTOM TAB BAR */
  .vel-tabbar {
    display: none;
  }
  .vel-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex: 1;
    padding: 8px 0;
    color: var(--ink-3);
    font-size: 0.66rem;
    font-weight: 600;
    transition: color 0.15s;
  }
  .vel-tab svg {
    width: 22px;
    height: 22px;
  }
  .vel-tab.on {
    color: var(--ink);
  }

  @media (max-width: 767px) {
    .vel-links {
      display: none;
    }
    .vel-login {
      display: none;
    }
    .vel-name {
      font-size: 20px;
    }
    .vel-tabbar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 150;
      display: flex;
      align-items: stretch;
      background: var(--card);
      border-top: 1px solid var(--line);
      padding-bottom: env(safe-area-inset-bottom, 0);
      box-shadow: 0 -4px 20px rgba(32, 27, 23, 0.06);
    }
  }
</style>
