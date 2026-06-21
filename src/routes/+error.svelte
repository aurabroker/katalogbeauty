<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — BeautyKatalog</title></svelte:head>

<div class="bk-container" style="padding:5rem 1rem;text-align:center">
  <p style="font-size:3rem;margin-bottom:1rem">😕</p>
  <h1 style="margin-bottom:.5rem">{page.status === 404 ? 'Nie znaleziono strony' : 'Wystąpił błąd'}</h1>
  <p style="color:var(--muted);margin-bottom:2rem">{page.error?.message ?? 'Spróbuj ponownie później.'}</p>
  <a href="/" class="bk-btn bk-btn-primary">← Wróć do katalogu</a>
</div>
