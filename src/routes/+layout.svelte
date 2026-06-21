<script>
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Toast from '$lib/components/Toast.svelte';

  let { children } = $props();
</script>

<Nav />
{@render children()}
<Toast />
