<script lang="ts">
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  let {
    token = $bindable('')
  }: { token?: string } = $props();

  const SITE_KEY = env.PUBLIC_TURNSTILE_SITE_KEY ?? '';
  const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

  let container = $state<HTMLDivElement>();
  let widgetId: string | undefined;

  function render() {
    if (!container || !window.turnstile || !SITE_KEY || widgetId) return;
    widgetId = window.turnstile.render(container, {
      sitekey: SITE_KEY,
      callback: (t: string) => (token = t),
      'expired-callback': () => (token = ''),
      'error-callback': () => (token = '')
    });
  }

  // Token Turnstile jest jednorazowy — po każdej próbie logowania/rejestracji
  // trzeba odświeżyć widget, aby uzyskać nowy.
  export function reset() {
    token = '';
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
  }

  onMount(() => {
    if (!SITE_KEY) {
      console.warn('[Turnstile] Brak PUBLIC_TURNSTILE_SITE_KEY — widget pominięty.');
      return;
    }
    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const iv = setInterval(() => {
        if (window.turnstile) {
          clearInterval(iv);
          render();
        }
      }, 200);
      return () => clearInterval(iv);
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  });
</script>

{#if SITE_KEY}
  <div class="ts" bind:this={container}></div>
{/if}

<style>
  .ts {
    margin-bottom: 1.25rem;
    min-height: 65px;
  }
</style>
