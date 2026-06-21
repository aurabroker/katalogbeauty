<script>
  /** @type {{ open?: boolean, children?: import('svelte').Snippet }} */
  let { open = $bindable(false), children } = $props();

  function close() {
    open = false;
  }

  /** @param {KeyboardEvent} e */
  function onKey(e) {
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
