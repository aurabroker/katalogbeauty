<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface PanelNavItem {
    id: string;
    label: string;
    icon?: string;
    badge?: string | number;
    badgeAlert?: boolean;
    href?: string;
  }
  export interface PanelNavGroup {
    label?: string;
    items: PanelNavItem[];
  }

  let {
    title,
    breadcrumb = '',
    nav = [],
    active = '',
    accent = 'gold',
    userName = '',
    userMeta = '',
    searchPlaceholder = 'Szukaj…',
    onselect,
    onlogout,
    children,
    upsell
  }: {
    title: string;
    breadcrumb?: string;
    nav?: PanelNavGroup[];
    active?: string;
    accent?: 'gold' | 'rose';
    userName?: string;
    userMeta?: string;
    searchPlaceholder?: string;
    onselect?: (id: string) => void;
    onlogout?: () => void;
    children?: Snippet;
    upsell?: Snippet;
  } = $props();

  let mobileOpen = $state(false);

  function pick(item: PanelNavItem) {
    if (!item.href) onselect?.(item.id);
    mobileOpen = false;
  }
</script>

<div class="pshell" class:rose={accent === 'rose'} class:menu-open={mobileOpen}>
  <!-- backdrop (mobile) -->
  <button
    type="button"
    class="pshell-backdrop"
    aria-label="Zamknij menu"
    onclick={() => (mobileOpen = false)}
  ></button>

  <!-- SIDEBAR -->
  <aside class="pshell-side">
    <a href="/" class="pshell-brand">
      <span class="pshell-mono" aria-hidden="true">V</span>
      <span class="pshell-word">VELORA</span>
    </a>

    <nav class="pshell-nav" aria-label={title}>
      {#each nav as group}
        {#if group.label}<span class="pshell-group">{group.label}</span>{/if}
        {#each group.items as item}
          {#if item.href}
            <a href={item.href} class="pshell-item" onclick={() => (mobileOpen = false)}>
              {@render icon(item.icon)}
              <span class="pshell-label">{item.label}</span>
              {#if item.badge != null}<span class="pshell-badge" class:alert={item.badgeAlert}>{item.badge}</span>{/if}
            </a>
          {:else}
            <button type="button" class="pshell-item" class:on={active === item.id} onclick={() => pick(item)}>
              {@render icon(item.icon)}
              <span class="pshell-label">{item.label}</span>
              {#if item.badge != null}<span class="pshell-badge" class:alert={item.badgeAlert}>{item.badge}</span>{/if}
            </button>
          {/if}
        {/each}
      {/each}
    </nav>

    {#if upsell}<div class="pshell-upsell">{@render upsell()}</div>{/if}

    <div class="pshell-account">
      <span class="pshell-avatar" aria-hidden="true"></span>
      <div class="pshell-account-meta">
        <span class="pshell-account-name">{userName || 'Konto'}</span>
        {#if userMeta}<span class="pshell-account-sub">{userMeta}</span>{/if}
      </div>
      {#if onlogout}
        <button type="button" class="pshell-logout" title="Wyloguj" aria-label="Wyloguj" onclick={onlogout}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 17H4.5A1.5 1.5 0 0 1 3 15.5v-11A1.5 1.5 0 0 1 4.5 3H8"/><path d="M13 14l4-4-4-4"/><path d="M17 10H8"/></svg>
        </button>
      {/if}
    </div>
  </aside>

  <!-- MAIN -->
  <div class="pshell-main">
    <header class="pshell-top">
      <div class="pshell-top-left">
        <button type="button" class="pshell-burger" aria-label="Menu" onclick={() => (mobileOpen = true)}>
          <span></span><span></span><span></span>
        </button>
        <div class="pshell-title">
          {#if breadcrumb}<span class="pshell-crumb">{breadcrumb}</span>{/if}
          <span class="pshell-h">{title}</span>
        </div>
      </div>
      <div class="pshell-top-right">
        <div class="pshell-search" aria-hidden="true">
          <span class="pshell-search-ic"></span>
          <span>{searchPlaceholder}</span>
        </div>
        <span class="pshell-bell" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3a5 5 0 0 0-5 5v3l-1.5 2.5h13L15 11V8a5 5 0 0 0-5-5z"/><path d="M8 16a2 2 0 0 0 4 0"/></svg>
          <span class="pshell-bell-dot"></span>
        </span>
        <span class="pshell-top-avatar" aria-hidden="true"></span>
      </div>
    </header>

    <div class="pshell-content">
      {@render children?.()}
    </div>
  </div>
</div>

{#snippet icon(name: string | undefined)}
  <svg class="pshell-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    {#if name === 'grid'}
      <rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" />
    {:else if name === 'building'}
      <rect x="4" y="4" width="12" height="13" rx="1" /><path d="M8 17v-3.5h4V17" /><path d="M7 7.5h2M11 7.5h2" />
    {:else if name === 'scissors'}
      <circle cx="6" cy="6" r="2.2" /><circle cx="6" cy="14" r="2.2" /><path d="M8 7.4L16 15M8 12.6L16 5" />
    {:else if name === 'image'}
      <rect x="3" y="4" width="14" height="12" rx="2" /><circle cx="7.5" cy="8.5" r="1.4" /><path d="M4 14l4-3 3 2 3-3 2 2" />
    {:else if name === 'briefcase'}
      <rect x="3" y="6" width="14" height="10" rx="1.5" /><path d="M7 6V4.6A1.6 1.6 0 0 1 8.6 3h2.8A1.6 1.6 0 0 1 13 4.6V6" />
    {:else if name === 'crown'}
      <path d="M3 6l3.2 3L10 4l3.8 5L17 6l-1.2 9H4.2z" /><path d="M4.2 15h11.6" />
    {:else if name === 'calendar'}
      <rect x="3" y="4.5" width="14" height="12.5" rx="1.6" /><path d="M3 8h14M7 3v3M13 3v3" />
    {:else if name === 'users'}
      <circle cx="7.5" cy="7" r="2.6" /><path d="M3.5 16c0-2.6 1.8-4.2 4-4.2s4 1.6 4 4.2" /><circle cx="14" cy="8" r="2" /><path d="M13 16c0-2 .8-3.4 3-3.4" />
    {:else if name === 'shield'}
      <path d="M10 3l6 2v4.5c0 3.8-2.8 5.8-6 6.8-3.2-1-6-3-6-6.8V5z" /><path d="M7.4 10l1.8 1.8L13 8.2" />
    {:else if name === 'card'}
      <rect x="3" y="5" width="14" height="10" rx="1.5" /><path d="M3 8.5h14" />
    {:else if name === 'chart'}
      <path d="M4 16V4M4 16h12" /><path d="M7 13v-3M11 13V7M15 13v-5" />
    {:else if name === 'heart'}
      <path d="M10 16S3.5 12 3.5 7.6A3.1 3.1 0 0 1 10 6a3.1 3.1 0 0 1 6.5 1.6C16.5 12 10 16 10 16z" />
    {:else if name === 'file'}
      <path d="M6 3h5l3 3v11H6z" /><path d="M11 3v3h3M8 11h4M8 14h4" />
    {:else if name === 'star'}
      <path d="M10 3l2 4.2 4.6.5-3.4 3.1.9 4.5L10 13.1 5.9 15.3l.9-4.5L3.4 7.7 8 7.2z" />
    {:else}
      <circle cx="10" cy="10" r="7" />
    {/if}
  </svg>
{/snippet}

<style>
  .pshell {
    --acc: var(--gold);
    --acc-soft: rgba(198, 161, 91, 0.16);
    display: grid;
    grid-template-columns: 250px 1fr;
    min-height: 100vh;
    background: var(--porcelain);
  }
  .pshell.rose {
    --acc: var(--rose);
    --acc-soft: rgba(211, 163, 155, 0.2);
  }

  /* SIDEBAR */
  .pshell-side {
    width: 250px;
    background: var(--sidebar-bg);
    color: #b6a997;
    padding: 24px 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
  .pshell-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 8px 20px;
  }
  .pshell-mono {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-size: 17px;
    color: var(--champagne);
    flex: none;
  }
  .pshell-word {
    font-family: var(--serif);
    font-size: 19px;
    letter-spacing: 0.14em;
    color: var(--porcelain);
  }
  .pshell-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pshell-group {
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #6e5f51;
    font-weight: 600;
    padding: 14px 10px 6px;
  }
  .pshell-group:first-child {
    padding-top: 4px;
  }
  .pshell-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 12px;
    border-radius: 10px;
    cursor: pointer;
    border: none;
    background: none;
    color: inherit;
    font-family: inherit;
    font-size: 14px;
    width: 100%;
    text-align: left;
    border-left: 2px solid transparent;
    transition: background 0.15s;
  }
  .pshell-item:hover {
    background: rgba(251, 247, 241, 0.05);
    color: #d8ccbc;
  }
  .pshell-item.on {
    background: var(--acc-soft);
    color: var(--porcelain);
    border-left-color: var(--acc);
    font-weight: 600;
  }
  .pshell-ico {
    width: 19px;
    height: 19px;
    flex: none;
  }
  .pshell-label {
    flex: 1;
    min-width: 0;
  }
  .pshell-badge {
    margin-left: auto;
    background: var(--acc);
    color: var(--ink);
    font-size: 10.5px;
    font-weight: 700;
    border-radius: 999px;
    padding: 2px 7px;
    flex: none;
  }
  .pshell-badge.alert {
    background: #b4534b;
    color: #fff;
  }
  .pshell-upsell {
    margin-top: 12px;
  }
  .pshell-account {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    background: rgba(251, 247, 241, 0.05);
  }
  .pshell-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(145deg, var(--gold), var(--copper));
    flex: none;
  }
  .pshell-account-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .pshell-account-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--porcelain);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pshell-account-sub {
    font-size: 11.5px;
    color: #8a7d71;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pshell-logout {
    background: none;
    border: none;
    color: #8a7d71;
    cursor: pointer;
    padding: 4px;
    flex: none;
    display: flex;
  }
  .pshell-logout:hover {
    color: var(--champagne);
  }
  .pshell-logout svg {
    width: 18px;
    height: 18px;
  }

  /* MAIN */
  .pshell-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .pshell-top {
    height: 70px;
    flex: none;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 clamp(16px, 3vw, 30px);
    background: var(--porcelain);
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .pshell-top-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .pshell-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .pshell-crumb {
    font-size: 11px;
    color: var(--ink-3);
  }
  .pshell-h {
    font-size: 19px;
    font-weight: 700;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pshell-top-right {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
  }
  .pshell-search {
    width: 260px;
    height: 40px;
    border-radius: 10px;
    background: var(--linen);
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 14px;
    font-size: 13.5px;
    color: var(--ink-3);
  }
  .pshell-search-ic {
    width: 13px;
    height: 13px;
    border: 1.8px solid var(--ink-3);
    border-radius: 50%;
    flex: none;
  }
  .pshell-bell {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: var(--graphite);
  }
  .pshell-bell svg {
    width: 18px;
    height: 18px;
  }
  .pshell-bell-dot {
    position: absolute;
    top: 8px;
    right: 9px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #b4534b;
  }
  .pshell-top-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(145deg, var(--gold), var(--copper));
    flex: none;
  }
  .pshell-content {
    padding: clamp(18px, 3vw, 26px) clamp(16px, 3vw, 30px) 40px;
  }

  /* mobile drawer */
  .pshell-burger,
  .pshell-backdrop {
    display: none;
  }
  .pshell-burger {
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
  }
  .pshell-burger span {
    width: 20px;
    height: 2px;
    background: var(--ink);
    border-radius: 2px;
  }

  @media (max-width: 900px) {
    .pshell {
      grid-template-columns: 1fr;
    }
    .pshell-side {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 60;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      box-shadow: 0 20px 60px rgba(32, 27, 23, 0.3);
    }
    .pshell.menu-open .pshell-side {
      transform: translateX(0);
    }
    .pshell.menu-open .pshell-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 55;
      background: rgba(32, 27, 23, 0.45);
      border: none;
      cursor: pointer;
    }
    .pshell-burger {
      display: flex;
    }
    .pshell-search {
      display: none;
    }
  }
  @media (max-width: 520px) {
    .pshell-top-avatar {
      display: none;
    }
  }
</style>
