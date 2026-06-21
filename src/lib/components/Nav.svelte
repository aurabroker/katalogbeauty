<script lang="ts">
  import { page } from '$app/state';

  const links = [
    { href: '/', label: 'Katalog salonów' },
    { href: '/panel', label: 'Mój salon' },
    { href: '/jobs', label: 'Praca' }
  ];

  const path = $derived(page.url.pathname);

  function isActive(href: string): boolean {
    return href === '/' ? path === '/' : path.startsWith(href);
  }
</script>

<nav id="bk-nav" aria-label="BeautyKatalog nawigacja">
  <div class="bk-nav-inner">
    <a href="/" class="bk-logo">Beauty<span>Katalog</span></a>
    <div class="bk-nav-links">
      {#each links as link}
        <a href={link.href} class="bk-nav-link" class:active={isActive(link.href)}>{link.label}</a>
      {/each}
    </div>
    <a href="/panel" class="bk-nav-cta">+ <span>Dodaj salon</span></a>
  </div>
</nav>
