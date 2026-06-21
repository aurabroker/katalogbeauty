<script lang="ts">
  import type { Snippet } from 'svelte';
  let { open = $bindable(false), children }: { open?: boolean; children?: Snippet } = $props();

  function close() {
    open = false;
  }

  function onKey(e: KeyboardEvent) {
    if (open && e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if open}
  <div
    class="bk-modal-bg"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="bk-modal" role="dialog" aria-modal="true">
      <button class="bk-modal-x" aria-label="Zamknij" onclick={close}>&times;</button>
      {@render children?.()}
    </div>
  </div>
{/if}
