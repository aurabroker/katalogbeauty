<script>
  /** @type {{ salon: any }} */
  let { salon } = $props();

  const cover = $derived(
    salon.salon_photos?.find((p) => p.is_cover)?.url ?? salon.salon_photos?.[0]?.url ?? ''
  );
  const serviceCount = $derived(salon.salon_services?.length ?? 0);
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
    <p class="loc">📍 {salon.city}{salon.street ? `, ${salon.street}` : ''}</p>
    {#if salon.tagline || salon.description}
      <p class="desc">{salon.tagline || salon.description}</p>
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
      box-shadow 0.2s;
  }
  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(124, 58, 237, 0.15);
  }
  .thumb {
    height: 190px;
    overflow: hidden;
    background: linear-gradient(135deg, #ede9fe, #ddd6fe);
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
    font-size: 0.975rem;
  }
  .loc {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }
  .desc {
    font-size: 0.82rem;
    color: #475569;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  .more {
    font-size: 0.8rem;
    color: var(--v);
    font-weight: 700;
  }
</style>
