<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children?: Snippet } = $props();
</script>

<footer class="bk-footer">
  <span>{#if children}{@render children()}{:else}© 2026 BeautyKatalog by Aura Consulting{/if}</span>
  <span class="legal"><a href="/regulamin">Regulamin</a></span>
</footer>

<style>
  .legal {
    margin-left: 0.5rem;
  }
  .legal a {
    color: inherit;
    opacity: 0.85;
    text-decoration: underline;
  }
  .legal a:hover {
    opacity: 1;
  }
</style>
