<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import PanelShell from '$lib/components/PanelShell.svelte';

  let activeTab = $state('pulpit');

  const navGroups = [
    {
      items: [
        { id: 'pulpit', label: 'Pulpit', icon: 'grid' },
        { id: 'rezerwacje', label: 'Moje rezerwacje', icon: 'calendar' },
        { id: 'zapisane', label: 'Zapisane salony', icon: 'heart' },
        { id: 'aplikacje', label: 'Aplikacje o pracę', icon: 'briefcase' },
        { id: 'cv', label: 'Profil i CV', icon: 'file' },
        { id: 'szkolenia', label: 'Moje szkolenia', icon: 'star' }
      ]
    }
  ];

  const TITLES: Record<string, string> = {
    pulpit: 'Pulpit',
    rezerwacje: 'Moje rezerwacje',
    zapisane: 'Zapisane salony',
    aplikacje: 'Aplikacje o pracę',
    cv: 'Profil i CV',
    szkolenia: 'Moje szkolenia'
  };
  const panelTitle = $derived(TITLES[activeTab] ?? 'Twoje konto');

  async function logout() {
    await sb.auth.signOut();
  }

  // ——— Dane demonstracyjne (do podpięcia pod backend w kolejnym etapie) ———
  const reservations = [
    { salon: 'Studio 01', service: 'Strzyżenie i modelowanie', when: 'Dziś · 14:00', status: 'Potwierdzona', kind: 'ok' },
    { salon: 'Beauty Loft', service: 'Manicure hybrydowy', when: '18 lip · 11:30', status: 'Oczekuje', kind: 'warn' },
    { salon: 'SPA Aurora', service: 'Masaż relaksacyjny', when: '24 lip · 17:00', status: 'Potwierdzona', kind: 'ok' }
  ];
  const applications = [
    { role: 'Stylistka paznokci', employer: 'Beauty Loft', stage: 'Rozmowa', kind: 'info' },
    { role: 'Recepcja SPA', employer: 'SPA Aurora', stage: 'W przeglądzie', kind: 'neutral' },
    { role: 'Kosmetolog', employer: 'Studio 01', stage: 'Wysłano', kind: 'neutral' }
  ];
  const myTrainings = [
    { title: 'Stylizacja rzęs 3D–6D', date: 'kurs w toku', progress: 60, status: 'W toku', kind: 'info' },
    { title: 'Manicure hybrydowy — podstawy', date: 'ukończono 12 cze', progress: 100, status: 'Ukończone', kind: 'ok' }
  ];
  const skills = ['Manicure hybrydowy', 'Zdobienia', 'Stylizacja rzęs', 'Pedicure', 'Obsługa klienta'];
  const cvCompleteness = 80;
</script>

<svelte:head><title>Twoje konto — VELORA</title><meta name="robots" content="noindex" /></svelte:head>

{#if !auth.ready}
  <Spinner />
{:else if !auth.user}
  <AuthForm
    title="Twoje konto VELORA"
    subtitle="Zaloguj się lub załóż konto, aby zarządzać rezerwacjami, aplikacjami i szkoleniami."
    backHref="/"
    backLabel="← Strona główna VELORA"
  />
{:else}
  <PanelShell
    title={panelTitle}
    breadcrumb="Twoje konto"
    nav={navGroups}
    active={activeTab}
    accent="rose"
    userName={auth.user.email?.split('@')[0] || 'Konto'}
    userMeta={auth.user.email}
    searchPlaceholder="Szukaj salonu, szkolenia…"
    onselect={(id) => (activeTab = id)}
    onlogout={logout}
  >
    {#if activeTab === 'pulpit'}
      <div class="kdash">
        <div class="kkpis">
          <div class="kkpi kkpi-dark">
            <span class="kkpi-l">Najbliższa wizyta</span>
            <span class="kkpi-v">Dziś · 14:00</span>
            <span class="kkpi-h">Studio 01 · Strzyżenie</span>
          </div>
          <div class="kkpi"><span class="kkpi-l">Zapisane salony</span><span class="kkpi-v">12</span><span class="kkpi-h">ulubione miejsca</span></div>
          <div class="kkpi"><span class="kkpi-l">Aplikacje w toku</span><span class="kkpi-v">3</span><span class="kkpi-h">rekrutacje</span></div>
          <div class="kkpi"><span class="kkpi-l">Moje szkolenia</span><span class="kkpi-v">2</span><span class="kkpi-h">1 w toku</span></div>
        </div>

        <div class="krow">
          <div class="kcard">
            <div class="kcard-head"><h3>Nadchodzące rezerwacje</h3></div>
            <div class="klist">
              {#each reservations as r}
                <div class="kitem">
                  <span class="kav" aria-hidden="true"></span>
                  <div class="kitem-main">
                    <span class="kitem-t">{r.salon}</span>
                    <span class="kitem-s">{r.service} · {r.when}</span>
                  </div>
                  <span class="pill {r.kind}">{r.status}</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="kcard">
            <div class="kcard-head"><h3>Profil kandydata / CV</h3><span class="kpct">{cvCompleteness}%</span></div>
            <div class="kbar"><span style="width:{cvCompleteness}%"></span></div>
            <div class="kchips">
              {#each skills as s}<span class="kchip">{s}</span>{/each}
            </div>
            <button type="button" class="bk-btn bk-btn-primary" style="align-self:flex-start" onclick={() => (activeTab = 'cv')}>Uzupełnij profil</button>
          </div>
        </div>

        <div class="krow">
          <div class="kcard">
            <div class="kcard-head"><h3>Status aplikacji o pracę</h3></div>
            <div class="klist">
              {#each applications as a}
                <div class="kitem">
                  <span class="kmono" aria-hidden="true">{a.employer[0]}</span>
                  <div class="kitem-main">
                    <span class="kitem-t">{a.role}</span>
                    <span class="kitem-s">{a.employer}</span>
                  </div>
                  <span class="pill {a.kind}">{a.stage}</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="kcard">
            <div class="kcard-head"><h3>Moje szkolenia</h3></div>
            <div class="klist">
              {#each myTrainings as t}
                <div class="ktrain">
                  <div class="ktrain-top">
                    <span class="kitem-t">{t.title}</span>
                    <span class="pill {t.kind}">{t.status}</span>
                  </div>
                  <span class="kitem-s">{t.date}</span>
                  <div class="kbar sm"><span style="width:{t.progress}%"></span></div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'rezerwacje'}
      <div class="kcard">
        <div class="kcard-head"><h3>Moje rezerwacje</h3></div>
        <div class="klist">
          {#each reservations as r}
            <div class="kitem">
              <span class="kav" aria-hidden="true"></span>
              <div class="kitem-main"><span class="kitem-t">{r.salon}</span><span class="kitem-s">{r.service} · {r.when}</span></div>
              <span class="pill {r.kind}">{r.status}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === 'aplikacje'}
      <div class="kcard">
        <div class="kcard-head"><h3>Aplikacje o pracę</h3></div>
        <div class="klist">
          {#each applications as a}
            <div class="kitem">
              <span class="kmono" aria-hidden="true">{a.employer[0]}</span>
              <div class="kitem-main"><span class="kitem-t">{a.role}</span><span class="kitem-s">{a.employer}</span></div>
              <span class="pill {a.kind}">{a.stage}</span>
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === 'szkolenia'}
      <div class="kcard">
        <div class="kcard-head"><h3>Moje szkolenia</h3></div>
        <div class="klist">
          {#each myTrainings as t}
            <div class="ktrain">
              <div class="ktrain-top"><span class="kitem-t">{t.title}</span><span class="pill {t.kind}">{t.status}</span></div>
              <span class="kitem-s">{t.date}</span>
              <div class="kbar sm"><span style="width:{t.progress}%"></span></div>
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === 'cv'}
      <div class="kcard" style="max-width:640px">
        <div class="kcard-head"><h3>Profil i CV</h3><span class="kpct">{cvCompleteness}%</span></div>
        <div class="kbar"><span style="width:{cvCompleteness}%"></span></div>
        <p class="kempty-note">Uzupełnij doświadczenie i portfolio, aby aplikować jednym kliknięciem.</p>
        <div class="kchips">{#each skills as s}<span class="kchip">{s}</span>{/each}</div>
      </div>
    {:else if activeTab === 'zapisane'}
      <div class="kcard">
        <div class="kcard-head"><h3>Zapisane salony</h3></div>
        <div class="kempty">
          Zapisuj ulubione salony klikając ♥ na kartach. Twoja lista pojawi się tutaj.
          <a href="/" class="klink">Przeglądaj salony →</a>
        </div>
      </div>
    {/if}
  </PanelShell>
{/if}

<style>
  .kdash {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .kkpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .kkpi {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .kkpi-dark {
    background: var(--sidebar-bg);
  }
  .kkpi-l {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 500;
  }
  .kkpi-dark .kkpi-l {
    color: var(--rose);
  }
  .kkpi-v {
    font-family: var(--serif);
    font-size: 30px;
    line-height: 1.05;
    color: var(--ink);
  }
  .kkpi-dark .kkpi-v {
    color: var(--porcelain);
  }
  .kkpi-h {
    font-size: 12px;
    color: var(--ink-3);
  }
  .krow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .kcard {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .kcard-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .kcard-head h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }
  .kpct {
    font-family: var(--serif);
    font-size: 22px;
    color: var(--rose);
  }
  .klist {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .kitem {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .kitem-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .kitem-t {
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
  }
  .kitem-s {
    font-size: 12.5px;
    color: var(--ink-3);
  }
  .kav {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(145deg, #e7cfc6, var(--rose));
    flex: none;
  }
  .kmono {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: linear-gradient(145deg, #f1e7da, #e0cfbc);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-size: 17px;
    color: var(--premium-fg);
    flex: none;
  }
  .ktrain {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .ktrain-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .kbar {
    height: 10px;
    border-radius: 999px;
    background: var(--linen);
    overflow: hidden;
  }
  .kbar.sm {
    height: 7px;
  }
  .kbar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--rose), var(--copper));
    border-radius: 999px;
    transition: width 0.3s;
  }
  .kchips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .kchip {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--accent-d);
    background: var(--blush);
    border-radius: 999px;
    padding: 5px 12px;
  }
  .kempty {
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    padding: 26px;
    text-align: center;
    font-size: 13.5px;
    color: var(--ink-3);
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  .kempty-note {
    font-size: 13px;
    color: var(--ink-2);
  }
  .klink {
    font-weight: 600;
    color: var(--copper);
  }

  /* Pill statusy */
  .pill {
    font-size: 11.5px;
    font-weight: 700;
    padding: 4px 11px;
    border-radius: 999px;
    white-space: nowrap;
    flex: none;
  }
  .pill.ok {
    background: var(--ok-bg);
    color: var(--ok-fg);
  }
  .pill.warn {
    background: var(--warn-bg);
    color: var(--warn-fg);
  }
  .pill.info {
    background: var(--info-bg);
    color: var(--info-fg);
  }
  .pill.neutral {
    background: var(--neutral-bg);
    color: var(--neutral-fg);
  }

  @media (max-width: 900px) {
    .kkpis {
      grid-template-columns: 1fr 1fr;
    }
    .krow {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 560px) {
    .kkpis {
      grid-template-columns: 1fr;
    }
  }
</style>
