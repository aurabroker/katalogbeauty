<script lang="ts">
  import type { SpecialistWithSalon } from '$lib/database.types';
  let { specialist }: { specialist: SpecialistWithSalon } = $props();

  const initials = $derived(
    specialist.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
  );
</script>

<a
  href={specialist.salon ? `/salon/${specialist.salon.id}` : '#'}
  class="bk-card card"
  aria-label={specialist.name}
>
  <div class="avatar">
    {#if specialist.photo_url}
      <img src={specialist.photo_url} alt={specialist.name} loading="lazy" />
    {:else}
      <span class="initials">{initials}</span>
    {/if}
  </div>
  <h3>{specialist.name}</h3>
  {#if specialist.role_label}
    <p class="role">{specialist.role_label}</p>
  {/if}
  {#if specialist.salon}
    <p class="salon">{specialist.salon.name}{specialist.salon.city ? ` · ${specialist.salon.city}` : ''}</p>
  {/if}
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1rem;
    color: inherit;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
  }
  .avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--blush);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.85rem;
    border: 1px solid var(--line);
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .initials {
    font-family: var(--serif);
    font-size: 1.6rem;
    font-weight: 500;
    color: var(--accent-d);
  }
  h3 {
    font-size: 1.05rem;
    font-weight: 500;
    margin-bottom: 0.15rem;
  }
  .role {
    font-size: 0.82rem;
    color: var(--accent);
    margin-bottom: 0.3rem;
  }
  .salon {
    font-size: 0.78rem;
    color: var(--ink-3);
  }
</style>
