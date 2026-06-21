<script lang="ts">
  import { toasts } from '$lib/stores/toast.svelte';
</script>

<div id="bk-toast" aria-live="polite">
  {#each toasts as t (t.id)}
    <div class="bk-toast-msg {t.type}">{t.msg}</div>
  {/each}
</div>
