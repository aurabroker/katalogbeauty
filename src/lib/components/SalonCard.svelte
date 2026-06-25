<script lang="ts">
  import type { SalonWithRelations } from '$lib/database.types';
  let { salon }: { salon: SalonWithRelations } = $props();

  const gallery = $derived((salon.gallery_assets ?? []).filter((p) => p.is_active !== false));
  const cover = $derived(
    salon.cover_image_url ?? gallery.find((p) => p.is_cover)?.public_url ?? gallery[0]?.public_url ?? ''
  );
  const serviceCount = $derived(
    (salon.services ?? []).filter((s) => s.is_active !== false).length
  );
</script>

<a href="/salon/{salon.id}" class="bk-card card">
  <div class="thumb">
    {#if cover}
      <img src={cover} alt={salon.name} loading="lazy" />
    {:else}
      <div class="placeholder">💅</div>
    {/if}
  </div>
  <div class="body">
    <div class="head">
      <h2>{salon.name}</h2>
      {#if serviceCount}
        <span class="bk-badge" style="flex-shrink:0">{serviceCount}&nbsp;zab.</span>
      {/if}
    </div>
    <p class="loc">📍 {salon.city}{salon.address_line ? `, ${salon.address_line}` : ''}</p>
    {#if salon.short_description || salon.description}
      <p class="desc">{salon.short_description || salon.description}</p>
    {/if}
    <span class="more">Zobacz profil →</span>
  </div>
</a>

<style>
  .card {
    display: block;
    overflow: hidden;
    color: inherit;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
  }
  .card:hover .more {
    color: var(--accent-d);
  }
  .thumb {
    height: 200px;
    overflow: hidden;
    background: var(--blush);
    position: relative;
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 3.5rem;
  }
  .body {
    padding: 1.1rem;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }
  .head h2 {
    font-size: 1.1rem;
    font-weight: 500;
  }
  .loc {
    font-size: 0.8rem;
    color: var(--ink-3);
    margin-bottom: 0.5rem;
  }
  .desc {
    font-size: 0.85rem;
    color: var(--ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  .more {
    font-size: 0.8rem;
    color: var(--accent);
    font-weight: 500;
    transition: color 0.2s;
  }
</style>
