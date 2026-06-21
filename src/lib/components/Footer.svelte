<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<footer class="bk-footer">
  {#if children}{@render children()}{:else}© 2026 BeautyKatalog by Aura Consulting{/if}
</footer>
