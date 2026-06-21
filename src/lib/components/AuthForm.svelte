<script>
  import { sb } from '$lib/supabase';
  import { toast } from '$lib/stores/toast.svelte.js';

  /** @type {{ title?: string, subtitle?: string, backHref?: string, backLabel?: string }} */
  let {
    title = 'Panel właściciela',
    subtitle = 'Zaloguj się lub utwórz konto, aby zarządzać swoim salonem.',
    backHref = '',
    backLabel = ''
  } = $props();

  let tab = $state('login');
  let lEmail = $state('');
  let lPass = $state('');
  let rEmail = $state('');
  let rPass = $state('');
  let busy = $state(false);

  async function doLogin() {
    if (!lEmail.trim() || !lPass) {
      toast('Uzupełnij email i hasło', 'error');
      return;
    }
    busy = true;
    const { error } = await sb.auth.signInWithPassword({ email: lEmail.trim(), password: lPass });
    busy = false;
    if (error) toast(error.message, 'error');
    // sukces: globalny store auth zareaguje i przełączy widok panelu
  }

  async function doRegister() {
    if (!rEmail.trim() || rPass.length < 8) {
      toast('Podaj poprawny email i hasło (min. 8 znaków)', 'error');
      return;
    }
    busy = true;
    const { error } = await sb.auth.signUp({ email: rEmail.trim(), password: rPass });
    busy = false;
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Sprawdź skrzynkę email — potwierdź rejestrację', 'success', 6000);
  }

  async function sendReset() {
    if (!lEmail.trim()) {
      toast('Wpisz email powyżej', 'error');
      return;
    }
    await sb.auth.resetPasswordForEmail(lEmail.trim(), { redirectTo: window.location.href });
    toast('Link resetowania wysłany', 'success');
  }
</script>

<main class="bk-container wrap">
  <div class="bk-card" style="padding:2rem">
    <h1>{title}</h1>
    <p class="sub">{subtitle}</p>

    <div class="tabs">
      <button class:on={tab === 'login'} onclick={() => (tab = 'login')}>Logowanie</button>
      <button class:on={tab === 'register'} onclick={() => (tab = 'register')}>Rejestracja</button>
    </div>

    {#if tab === 'login'}
      <div>
        <div class="fg">
          <label class="bk-label" for="l-email">Email</label>
          <input id="l-email" type="email" class="bk-input" placeholder="twoj@email.pl" bind:value={lEmail} />
        </div>
        <div class="fg">
          <label class="bk-label" for="l-pass">Hasło</label>
          <input id="l-pass" type="password" class="bk-input" placeholder="••••••••" bind:value={lPass} onkeydown={(e) => e.key === 'Enter' && doLogin()} />
        </div>
        <button class="bk-btn bk-btn-primary" style="width:100%" disabled={busy} onclick={doLogin}>
          {busy ? 'Logowanie...' : 'Zaloguj się'}
        </button>
        <p class="reset"><a href="#reset" onclick={(e) => { e.preventDefault(); sendReset(); }}>Zapomniałem/am hasła</a></p>
      </div>
    {:else}
      <div>
        <div class="fg">
          <label class="bk-label" for="r-email">Email</label>
          <input id="r-email" type="email" class="bk-input" placeholder="twoj@email.pl" bind:value={rEmail} />
        </div>
        <div class="fg">
          <label class="bk-label" for="r-pass">Hasło (min. 8 znaków)</label>
          <input id="r-pass" type="password" class="bk-input" placeholder="••••••••" bind:value={rPass} />
        </div>
        <button class="bk-btn bk-btn-primary" style="width:100%" disabled={busy} onclick={doRegister}>
          {busy ? 'Tworzenie konta...' : 'Utwórz konto'}
        </button>
      </div>
    {/if}

    {#if backHref}
      <p class="back"><a href={backHref}>{backLabel || '← Wróć'}</a></p>
    {/if}
  </div>
</main>

<style>
  .wrap {
    max-width: 440px;
    padding-top: 4rem;
    padding-bottom: 4rem;
  }
  h1 {
    font-size: 1.4rem;
    margin-bottom: 0.25rem;
  }
  .sub {
    font-size: 0.85rem;
    color: var(--muted);
    margin-bottom: 1.75rem;
  }
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .tabs button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    background: var(--vl);
    color: var(--v);
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .tabs button.on {
    background: var(--v);
    color: #fff;
  }
  .fg {
    margin-bottom: 1rem;
  }
  .fg:last-of-type {
    margin-bottom: 1.25rem;
  }
  .reset {
    margin-top: 1rem;
    font-size: 0.8rem;
    text-align: center;
  }
  .reset a {
    color: var(--v);
  }
  .back {
    margin-top: 1.5rem;
    font-size: 0.8rem;
    text-align: center;
  }
  .back a {
    color: var(--v);
  }
</style>
