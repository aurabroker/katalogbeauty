<script>
  /** @type {{ children?: import('svelte').Snippet }} */
  let { children } = $props();
</script>

<footer class="bk-footer">
  {#if children}{@render children()}{:else}© 2026 BeautyKatalog by Aura Consulting{/if}
</footer>
