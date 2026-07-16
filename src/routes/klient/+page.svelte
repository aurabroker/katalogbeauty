<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { trainingDate, formatLabel } from '$lib/utils';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import PanelShell from '$lib/components/PanelShell.svelte';
  import type { TrainingEnrollment, JobApplication, Training, Salon } from '$lib/database.types';

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

  const APP_STAGES: Record<string, string> = {
    sent: 'Wysłano',
    review: 'W przeglądzie',
    interview: 'Rozmowa',
    offer: 'Oferta',
    rejected: 'Odrzucono'
  };

  type EnrollVM = TrainingEnrollment & { training: Pick<Training, 'id' | 'slug' | 'title' | 'event_date' | 'city' | 'format'> | null };
  type AppVM = JobApplication & { job: Pick<Salon, 'id'> & { title: string; city: string } | null };
  type SavedVM = { created_at: string; salon: Pick<Salon, 'id' | 'name' | 'city'> | null };

  let loading = $state(true);
  let loadedFor: string | null = null;
  let enrollments = $state<EnrollVM[]>([]);
  let applications = $state<AppVM[]>([]);
  let saved = $state<SavedVM[]>([]);

  // CV / profil
  let cvName = $state('');
  let cvHeadline = $state('');
  let cvExp = $state('');
  let cvCity = $state('');
  let cvPhone = $state('');
  let cvPortfolio = $state('');
  let cvBio = $state('');
  let cvSkills = $state('');
  let savingCv = $state(false);

  const skillsArr = $derived(cvSkills.split(',').map((s) => s.trim()).filter(Boolean));
  const cvCompleteness = $derived.by(() => {
    const checks = [!!cvName.trim(), !!cvHeadline.trim(), !!cvBio.trim(), !!cvExp.trim(), skillsArr.length > 0, !!cvCity.trim()];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  const activeApps = $derived(applications.filter((a) => a.stage !== 'rejected').length);

  $effect(() => {
    const uid = auth.user?.id;
    if (!uid || loadedFor === uid) return;
    loadedFor = uid;
    void loadAll(uid);
  });

  async function loadAll(uid: string) {
    loading = true;
    const [enr, apps, sav, cv] = await Promise.all([
      sb.from('training_enrollments').select('*, training:trainings(id,slug,title,event_date,city,format)').eq('user_id', uid).order('created_at', { ascending: false }),
      sb.from('job_applications').select('*, job:job_listings(id,title,city)').eq('applicant_user_id', uid).order('created_at', { ascending: false }),
      sb.from('saved_salons').select('created_at, salon:salons(id,name,city)').eq('user_id', uid).order('created_at', { ascending: false }),
      sb.from('candidate_profiles').select('*').eq('user_id', uid).maybeSingle()
    ]);
    enrollments = (enr.data ?? []) as unknown as EnrollVM[];
    applications = (apps.data ?? []) as unknown as AppVM[];
    saved = (sav.data ?? []) as unknown as SavedVM[];
    if (cv.data) {
      cvName = cv.data.full_name ?? '';
      cvHeadline = cv.data.headline ?? '';
      cvExp = cv.data.experience_years != null ? String(cv.data.experience_years) : '';
      cvCity = cv.data.city ?? '';
      cvPhone = cv.data.phone ?? '';
      cvPortfolio = cv.data.portfolio_url ?? '';
      cvBio = cv.data.bio ?? '';
      cvSkills = (cv.data.skills ?? []).join(', ');
    }
    loading = false;
  }

  async function saveCv() {
    if (!auth.user) return;
    savingCv = true;
    const { error } = await sb.from('candidate_profiles').upsert({
      user_id: auth.user.id,
      full_name: cvName.trim() || null,
      headline: cvHeadline.trim() || null,
      experience_years: parseInt(cvExp, 10) || null,
      city: cvCity.trim() || null,
      phone: cvPhone.trim() || null,
      portfolio_url: cvPortfolio.trim() || null,
      bio: cvBio.trim() || null,
      skills: skillsArr,
      updated_at: new Date().toISOString()
    });
    savingCv = false;
    if (error) return toast('Błąd: ' + error.message, 'error');
    toast('Profil zapisany ✓', 'success');
  }

  async function removeSaved(salonId: string) {
    if (!auth.user) return;
    const { error } = await sb.from('saved_salons').delete().eq('user_id', auth.user.id).eq('salon_id', salonId);
    if (error) return toast('Błąd: ' + error.message, 'error');
    saved = saved.filter((s) => s.salon?.id !== salonId);
  }
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
    onlogout={async () => { await sb.auth.signOut(); }}
  >
    {#if loading}
      <Spinner />
    {:else if activeTab === 'pulpit'}
      <div class="kdash">
        <div class="kkpis">
          <div class="kkpi kkpi-dark"><span class="kkpi-l">Najbliższa wizyta</span><span class="kkpi-v">—</span><span class="kkpi-h">Rezerwacje wkrótce</span></div>
          <div class="kkpi"><span class="kkpi-l">Zapisane salony</span><span class="kkpi-v">{saved.length}</span><span class="kkpi-h">ulubione miejsca</span></div>
          <div class="kkpi"><span class="kkpi-l">Aplikacje w toku</span><span class="kkpi-v">{activeApps}</span><span class="kkpi-h">z {applications.length} łącznie</span></div>
          <div class="kkpi"><span class="kkpi-l">Moje szkolenia</span><span class="kkpi-v">{enrollments.length}</span><span class="kkpi-h">zapisów</span></div>
        </div>

        <div class="krow">
          <div class="kcard">
            <div class="kcard-head"><h3>Status aplikacji o pracę</h3></div>
            {#if !applications.length}
              <div class="kempty">Nie wysłałeś jeszcze żadnej aplikacji. <a href="/jobs" class="klink">Zobacz oferty →</a></div>
            {:else}
              <div class="klist">
                {#each applications.slice(0, 4) as a (a.id)}
                  <div class="kitem">
                    <span class="kmono" aria-hidden="true">{(a.job?.title ?? '?')[0]}</span>
                    <div class="kitem-main"><span class="kitem-t">{a.job?.title ?? 'Ogłoszenie'}</span><span class="kitem-s">{a.job?.city ?? ''}</span></div>
                    <span class="pill s-{a.stage}">{APP_STAGES[a.stage] ?? a.stage}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <div class="kcard">
            <div class="kcard-head"><h3>Profil kandydata / CV</h3><span class="kpct">{cvCompleteness}%</span></div>
            <div class="kbar"><span style="width:{cvCompleteness}%"></span></div>
            {#if skillsArr.length}<div class="kchips">{#each skillsArr.slice(0, 6) as s}<span class="kchip">{s}</span>{/each}</div>{/if}
            <button type="button" class="bk-btn bk-btn-primary" style="align-self:flex-start" onclick={() => (activeTab = 'cv')}>Uzupełnij profil</button>
          </div>
        </div>

        <div class="kcard">
          <div class="kcard-head"><h3>Moje szkolenia</h3></div>
          {#if !enrollments.length}
            <div class="kempty">Nie masz jeszcze zapisów. <a href="/szkolenia" class="klink">Przeglądaj szkolenia →</a></div>
          {:else}
            <div class="klist">
              {#each enrollments.slice(0, 4) as e (e.id)}
                <div class="kitem">
                  <span class="kav" aria-hidden="true"></span>
                  <div class="kitem-main"><span class="kitem-t">{e.training?.title ?? 'Szkolenie'}</span><span class="kitem-s">{formatLabel(e.training?.format)} · {trainingDate(e.training?.event_date)}</span></div>
                  <span class="pill ok">Opłacone</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {:else if activeTab === 'aplikacje'}
      <div class="kcard">
        <div class="kcard-head"><h3>Aplikacje o pracę</h3></div>
        {#if !applications.length}
          <div class="kempty">Brak aplikacji. <a href="/jobs" class="klink">Zobacz oferty pracy →</a></div>
        {:else}
          <div class="klist">
            {#each applications as a (a.id)}
              <div class="kitem">
                <span class="kmono" aria-hidden="true">{(a.job?.title ?? '?')[0]}</span>
                <div class="kitem-main"><span class="kitem-t">{a.job?.title ?? 'Ogłoszenie'}</span><span class="kitem-s">{a.job?.city ?? ''} · aplikacja {trainingDate(a.created_at)}</span></div>
                <span class="pill s-{a.stage}">{APP_STAGES[a.stage] ?? a.stage}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'szkolenia'}
      <div class="kcard">
        <div class="kcard-head"><h3>Moje szkolenia</h3></div>
        {#if !enrollments.length}
          <div class="kempty">Nie masz jeszcze zapisów. <a href="/szkolenia" class="klink">Przeglądaj szkolenia →</a></div>
        {:else}
          <div class="klist">
            {#each enrollments as e (e.id)}
              <a href="/szkolenia/{e.training?.slug}" class="kitem kitem-link">
                <span class="kav" aria-hidden="true"></span>
                <div class="kitem-main"><span class="kitem-t">{e.training?.title ?? 'Szkolenie'}</span><span class="kitem-s">{formatLabel(e.training?.format)} · {e.training?.city ?? 'online'} · {trainingDate(e.training?.event_date)}</span></div>
                <span class="pill ok">Opłacone</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'zapisane'}
      <div class="kcard">
        <div class="kcard-head"><h3>Zapisane salony</h3></div>
        {#if !saved.length}
          <div class="kempty">Zapisuj ulubione salony, aby mieć je pod ręką. <a href="/" class="klink">Przeglądaj salony →</a></div>
        {:else}
          <div class="klist">
            {#each saved as s (s.salon?.id)}
              <div class="kitem">
                <span class="kav" aria-hidden="true"></span>
                <div class="kitem-main"><span class="kitem-t">{s.salon?.name ?? 'Salon'}</span><span class="kitem-s">{s.salon?.city ?? ''}</span></div>
                <a href="/salon/{s.salon?.id}" class="klink" style="font-size:13px">Zobacz →</a>
                <button type="button" class="kremove" title="Usuń z zapisanych" onclick={() => s.salon && removeSaved(s.salon.id)}>×</button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'rezerwacje'}
      <div class="kcard">
        <div class="kcard-head"><h3>Moje rezerwacje</h3></div>
        <div class="kempty">Rezerwacje online pojawią się tutaj. Moduł rezerwacji wizyt jest w przygotowaniu. <a href="/" class="klink">Przeglądaj salony →</a></div>
      </div>
    {:else if activeTab === 'cv'}
      <div class="kcard" style="max-width:720px">
        <div class="kcard-head"><h3>Profil i CV</h3><span class="kpct">{cvCompleteness}%</span></div>
        <div class="kbar"><span style="width:{cvCompleteness}%"></span></div>
        <p class="kempty-note">Uzupełnij profil, aby aplikować na oferty jednym kliknięciem. Dane trafiają do pracodawcy przy aplikacji.</p>
        <div class="cv-grid">
          <div class="cv-f"><label class="bk-label" for="cv-name">Imię i nazwisko</label><input id="cv-name" class="bk-input" bind:value={cvName} placeholder="Anna Kowalska" /></div>
          <div class="cv-f"><label class="bk-label" for="cv-head">Specjalizacja / stanowisko</label><input id="cv-head" class="bk-input" bind:value={cvHeadline} placeholder="Stylistka paznokci" /></div>
          <div class="cv-f"><label class="bk-label" for="cv-exp">Doświadczenie (lata)</label><input id="cv-exp" class="bk-input" type="number" min="0" bind:value={cvExp} /></div>
          <div class="cv-f"><label class="bk-label" for="cv-city">Miasto</label><input id="cv-city" class="bk-input" bind:value={cvCity} placeholder="Warszawa" /></div>
          <div class="cv-f"><label class="bk-label" for="cv-phone">Telefon</label><input id="cv-phone" class="bk-input" bind:value={cvPhone} placeholder="+48 600 000 000" /></div>
          <div class="cv-f"><label class="bk-label" for="cv-port">Portfolio (URL)</label><input id="cv-port" class="bk-input" bind:value={cvPortfolio} placeholder="https://instagram.com/..." /></div>
          <div class="cv-f cv-full"><label class="bk-label" for="cv-skills">Umiejętności (oddziel przecinkami)</label><input id="cv-skills" class="bk-input" bind:value={cvSkills} placeholder="Manicure hybrydowy, Zdobienia, Pedicure" /></div>
          <div class="cv-f cv-full"><label class="bk-label" for="cv-bio">O mnie</label><textarea id="cv-bio" class="bk-input" rows="4" style="resize:vertical" bind:value={cvBio} placeholder="Krótko o doświadczeniu i tym, czego szukasz…"></textarea></div>
        </div>
        {#if skillsArr.length}<div class="kchips" style="margin-top:12px">{#each skillsArr as s}<span class="kchip">{s}</span>{/each}</div>{/if}
        <div style="margin-top:16px"><button type="button" class="bk-btn bk-btn-primary" disabled={savingCv} onclick={saveCv}>{savingCv ? 'Zapisywanie…' : 'Zapisz profil'}</button></div>
      </div>
    {/if}
  </PanelShell>
{/if}

<style>
  .kdash { display: flex; flex-direction: column; gap: 20px; }
  .kkpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .kkpi { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
  .kkpi-dark { background: var(--sidebar-bg); }
  .kkpi-l { font-size: 12px; color: var(--ink-3); font-weight: 500; }
  .kkpi-dark .kkpi-l { color: var(--rose); }
  .kkpi-v { font-family: var(--serif); font-size: 30px; line-height: 1.05; color: var(--ink); }
  .kkpi-dark .kkpi-v { color: var(--porcelain); }
  .kkpi-h { font-size: 12px; color: var(--ink-3); }
  .krow { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .kcard { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
  .kcard-head { display: flex; align-items: center; justify-content: space-between; }
  .kcard-head h3 { font-size: 15px; font-weight: 700; color: var(--ink); }
  .kpct { font-family: var(--serif); font-size: 22px; color: var(--rose); }
  .klist { display: flex; flex-direction: column; gap: 10px; }
  .kitem { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; color: inherit; }
  .kitem-link:hover { border-color: var(--rose); }
  .kitem-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .kitem-t { font-size: 14px; font-weight: 700; color: var(--ink); }
  .kitem-s { font-size: 12.5px; color: var(--ink-3); }
  .kav { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(145deg, #e7cfc6, var(--rose)); flex: none; }
  .kmono { width: 38px; height: 38px; border-radius: 11px; background: linear-gradient(145deg, #f1e7da, #e0cfbc); display: flex; align-items: center; justify-content: center; font-family: var(--serif); font-size: 17px; color: var(--premium-fg); flex: none; text-transform: uppercase; }
  .kbar { height: 10px; border-radius: 999px; background: var(--linen); overflow: hidden; }
  .kbar span { display: block; height: 100%; background: linear-gradient(90deg, var(--rose), var(--copper)); border-radius: 999px; transition: width 0.3s; }
  .kchips { display: flex; flex-wrap: wrap; gap: 8px; }
  .kchip { font-size: 12.5px; font-weight: 600; color: var(--accent-d); background: var(--blush); border-radius: 999px; padding: 5px 12px; }
  .kempty { border: 1px dashed var(--line-strong); border-radius: 12px; padding: 24px; text-align: center; font-size: 13.5px; color: var(--ink-3); }
  .kempty-note { font-size: 13px; color: var(--ink-2); }
  .klink { font-weight: 600; color: var(--copper); }
  .kremove { background: none; border: none; color: var(--ink-3); font-size: 20px; line-height: 1; cursor: pointer; padding: 0 4px; flex: none; }
  .kremove:hover { color: var(--err-fg); }

  .cv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .cv-f { display: flex; flex-direction: column; gap: 5px; }
  .cv-full { grid-column: 1 / -1; }

  .pill { font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px; white-space: nowrap; flex: none; }
  .pill.ok { background: var(--ok-bg); color: var(--ok-fg); }
  .pill.s-sent { background: var(--neutral-bg); color: var(--neutral-fg); }
  .pill.s-review { background: var(--info-bg); color: var(--info-fg); }
  .pill.s-interview { background: var(--warn-bg); color: var(--warn-fg); }
  .pill.s-offer { background: var(--ok-bg); color: var(--ok-fg); }
  .pill.s-rejected { background: var(--err-bg); color: var(--err-fg); }

  @media (max-width: 900px) {
    .kkpis { grid-template-columns: 1fr 1fr; }
    .krow { grid-template-columns: 1fr; }
    .cv-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 560px) {
    .kkpis { grid-template-columns: 1fr; }
  }
</style>
