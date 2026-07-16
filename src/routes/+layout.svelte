<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { page } from '$app/state';

  let { children } = $props();

  // Trasy z własnym app-shellem (PanelShell) nie pokazują publicznej nawigacji.
  const shellRoutes = ['/panel', '/admin', '/klient'];
  const isShell = $derived(
    shellRoutes.some((p) => page.url.pathname === p || page.url.pathname.startsWith(p + '/'))
  );
</script>

{#if !isShell}<Nav />{/if}
{@render children()}
<Toast />
