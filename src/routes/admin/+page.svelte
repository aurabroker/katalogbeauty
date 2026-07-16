<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { salaryLabel, timeAgo, isValidEmail, isValidPhone, VOIVODESHIPS } from '$lib/utils';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import PanelShell from '$lib/components/PanelShell.svelte';
  import type { Database, JobListing, Salon, JobType, JobStatus, Employment } from '$lib/database.types';

  interface AdminUser {
    id: string;
    email: string;
    created_at: string;
    salons_count: number;
    jobs_count: number;
    is_admin: boolean;
  }
  interface Stats {
    salons_total: number;
    salons_active: number;
    jobs_total: number;
    jobs_active: number;
    jobs_paid: number;
    revenue_pln: number;
    users_total: number;
  }

  // null = sprawdzanie, false = brak dostępu, true = admin
  let isAdmin = $state<boolean | null>(null);
  let checkedFor: string | null = null;
  let loading = $state(false);

  let activeTab = $state<'stats' | 'jobs' | 'salons' | 'users'>('stats');

  let stats = $state<Stats | null>(null);
  let jobs = $state<JobListing[]>([]);
  let salons = $state<Salon[]>([]);
  let users = $state<AdminUser[]>([]);

  const pendingCount = $derived(jobs.filter((j) => j.status !== 'active').length);

  const navGroups = $derived([
    {
      label: 'Ogólne',
      items: [
        { id: 'stats', label: 'Pulpit', icon: 'grid' },
        { id: 'jobs', label: 'Ogłoszenia', icon: 'briefcase', badge: pendingCount || undefined, badgeAlert: true },
        { id: 'salons', label: 'Salony', icon: 'building' },
        { id: 'users', label: 'Użytkownicy', icon: 'users' }
      ]
    }
  ]);

  const TITLES: Record<string, string> = {
    stats: 'Pulpit',
    jobs: 'Moderacja ogłoszeń',
    salons: 'Salony',
    users: 'Użytkownicy'
  };
  const panelTitle = $derived(TITLES[activeTab] ?? 'Panel administratora');

  // filtr listy ogłoszeń (kolejka moderacji)
  let jobFilter = $state<'all' | 'pending' | 'active'>('pending');
  const jobFilters = [
    { id: 'pending', label: '⏳ Do akceptacji' },
    { id: 'active', label: '✅ Opublikowane' },
    { id: 'all', label: 'Wszystkie' }
  ] as const;
  const visibleJobs = $derived(
    jobs.filter((j) =>
      jobFilter === 'pending' ? j.status !== 'active' : jobFilter === 'active' ? j.status === 'active' : true
    )
  );

  // inline panel aktywacji ogłoszenia
  let payJobId = $state<string | null>(null);
  let payPrice = $state('50');
  let payDays = $state('30');

  // dodawanie ogłoszenia przez admina
  interface NewJobForm {
    type: JobType;
    title: string;
    city: string;
    voivodeship: string;
    description: string;
    salary_from: string;
    salary_to: string;
    employment: Employment | '';
    phone: string;
    email: string;
    status: JobStatus;
    price: string;
    days: string;
  }
  function emptyJobForm(): NewJobForm {
    return {
      type: 'hiring', title: '', city: '', voivodeship: '', description: '',
      salary_from: '', salary_to: '', employment: '', phone: '', email: '',
      status: 'active', price: '0', days: '30'
    };
  }
  let showNewJob = $state(false);
  let savingNew = $state(false);
  let newJob = $state<NewJobForm>(emptyJobForm());

  function toggleNewJob() {
    showNewJob = !showNewJob;
    if (showNewJob) newJob = emptyJobForm();
  }

  async function createJob() {
    if (!auth.user) return;
    if (!newJob.title.trim() || !newJob.city.trim()) return toast('Wypełnij stanowisko i miasto', 'error');
    if (!newJob.phone.trim() || !newJob.email.trim()) return toast('Telefon i e-mail są obowiązkowe', 'error');
    if (!isValidPhone(newJob.phone)) return toast('Podaj poprawny numer telefonu (9 cyfr)', 'error');
    if (!isValidEmail(newJob.email)) return toast('Podaj poprawny adres e-mail', 'error');

    const active = newJob.status === 'active';
    const price = parseFloat(newJob.price) || 0;
    const days = parseInt(newJob.days, 10) || 30;
    const payload = {
      owner_id: auth.user.id,
      type: newJob.type,
      title: newJob.title.trim(),
      city: newJob.city.trim(),
      voivodeship: newJob.voivodeship || null,
      description: newJob.description.trim() || null,
      salary_from: parseFloat(newJob.salary_from) || null,
      salary_to: parseFloat(newJob.salary_to) || null,
      employment: newJob.employment || null,
      phone: newJob.phone.trim(),
      email: newJob.email.trim(),
      status: newJob.status,
      payment_status: active ? 'paid' : 'unpaid',
      paid_at: active ? new Date().toISOString() : null,
      price_pln: active ? price : null,
      expires_at: active ? new Date(Date.now() + days * 86400000).toISOString() : null
    } satisfies Database['public']['Tables']['job_listings']['Insert'];

    savingNew = true;
    const { data, error } = await sb.from('job_listings').insert(payload).select().single();
    savingNew = false;
    if (error || !data) return toast('Błąd: ' + (error?.message ?? 'brak danych'), 'error');
    jobs = [data as JobListing, ...jobs];
    showNewJob = false;
    newJob = emptyJobForm();
    toast('Ogłoszenie dodane ✓', 'success');
    void refreshStats();
  }

  const typeLabel: Record<JobType, string> = { hiring: '💼 Zatrudnię', looking: '🙋 Szukam pracy' };

  $effect(() => {
    if (!auth.ready) return;
    const uid = auth.user?.id ?? null;
    if (checkedFor === uid) return;
    checkedFor = uid;
    if (!uid) {
      isAdmin = null;
      return;
    }
    void checkAndLoad();
  });

  async function checkAndLoad() {
    isAdmin = null;
    const { data, error } = await sb.rpc('is_katalog_admin');
    if (error) {
      isAdmin = false;
      toast('Błąd weryfikacji uprawnień: ' + error.message, 'error');
      return;
    }
    isAdmin = data === true;
    if (isAdmin) void loadAll();
  }

  async function loadAll() {
    loading = true;
    const [s, j, sal, u] = await Promise.all([
      sb.rpc('katalog_admin_stats'),
      sb.from('job_listings').select('*').order('created_at', { ascending: false }),
      sb.from('salons').select('*').order('created_at', { ascending: false }),
      sb.rpc('katalog_admin_users')
    ]);
    loading = false;
    if (s.data) stats = s.data as unknown as Stats;
    jobs = (j.data as JobListing[]) ?? [];
    salons = (sal.data as Salon[]) ?? [];
    users = (u.data as AdminUser[]) ?? [];
    if (j.error) toast('Ogłoszenia: ' + j.error.message, 'error');
    if (sal.error) toast('Salony: ' + sal.error.message, 'error');
    if (u.error) toast('Użytkownicy: ' + u.error.message, 'error');
  }

  // ---- Ogłoszenia ----
  function openPay(j: JobListing) {
    payJobId = j.id;
    payPrice = j.price_pln != null && j.price_pln > 0 ? String(j.price_pln) : '50';
    payDays = '30';
  }

  async function confirmActivate() {
    if (!payJobId) return;
    const price = parseFloat(payPrice);
    const days = parseInt(payDays, 10);
    if (isNaN(price) || price < 0) return toast('Podaj poprawną kwotę', 'error');
    if (isNaN(days) || days < 1) return toast('Podaj poprawną liczbę dni', 'error');
    const expires = new Date(Date.now() + days * 86400000).toISOString();
    const { data, error } = await sb
      .from('job_listings')
      .update({ status: 'active', payment_status: 'paid', paid_at: new Date().toISOString(), price_pln: price, expires_at: expires })
      .eq('id', payJobId)
      .select()
      .single();
    if (error || !data) return toast('Błąd: ' + (error?.message ?? 'brak danych'), 'error');
    jobs = jobs.map((x) => (x.id === payJobId ? (data as JobListing) : x));
    payJobId = null;
    toast('Ogłoszenie opłacone i aktywne ✓', 'success');
    void refreshStats();
  }

  // Akceptacja bezpłatnego ogłoszenia „Szukam pracy" (moderacja przed publikacją)
  async function approveFree(j: JobListing) {
    const days = 60;
    const expires = new Date(Date.now() + days * 86400000).toISOString();
    const { data, error } = await sb
      .from('job_listings')
      .update({ status: 'active', payment_status: 'paid', paid_at: new Date().toISOString(), price_pln: 0, expires_at: expires })
      .eq('id', j.id)
      .select()
      .single();
    if (error || !data) return toast('Błąd: ' + (error?.message ?? 'brak danych'), 'error');
    jobs = jobs.map((x) => (x.id === j.id ? (data as JobListing) : x));
    toast('Ogłoszenie zaakceptowane i opublikowane ✓', 'success');
    void refreshStats();
  }

  async function hideJob(j: JobListing) {
    const { data, error } = await sb.from('job_listings').update({ status: 'draft' }).eq('id', j.id).select().single();
    if (error || !data) return toast('Błąd: ' + (error?.message ?? ''), 'error');
    jobs = jobs.map((x) => (x.id === j.id ? (data as JobListing) : x));
    toast('Ogłoszenie ukryte', 'info');
    void refreshStats();
  }

  async function extendJob(j: JobListing, days: number) {
    const base = j.expires_at && new Date(j.expires_at) > new Date() ? new Date(j.expires_at) : new Date();
    const expires = new Date(base.getTime() + days * 86400000).toISOString();
    const { data, error } = await sb.from('job_listings').update({ expires_at: expires }).eq('id', j.id).select().single();
    if (error || !data) return toast('Błąd: ' + (error?.message ?? ''), 'error');
    jobs = jobs.map((x) => (x.id === j.id ? (data as JobListing) : x));
    toast(`Przedłużono o ${days} dni ✓`, 'success');
  }

  async function deleteJob(j: JobListing) {
    if (!confirm(`Usunąć ogłoszenie „${j.title}"?`)) return;
    const { error } = await sb.from('job_listings').delete().eq('id', j.id);
    if (error) return toast('Błąd: ' + error.message, 'error');
    jobs = jobs.filter((x) => x.id !== j.id);
    toast('Ogłoszenie usunięte', 'info');
    void refreshStats();
  }

  // ---- Salony ----
  async function toggleSalon(s: Salon) {
    const activating = s.status !== 'active';
    const patch = activating
      ? { status: 'active' as const, published_at: s.published_at ?? new Date().toISOString() }
      : { status: 'suspended' as const };
    const { data, error } = await sb.from('salons').update(patch).eq('id', s.id).select().single();
    if (error || !data) return toast('Błąd: ' + (error?.message ?? ''), 'error');
    salons = salons.map((x) => (x.id === s.id ? (data as Salon) : x));
    toast(activating ? 'Salon widoczny ✓' : 'Salon ukryty', 'info');
    void refreshStats();
  }

  async function deleteSalon(s: Salon) {
    if (!confirm(`Usunąć salon „${s.name}" wraz z usługami i zdjęciami?`)) return;
    const { error } = await sb.from('salons').delete().eq('id', s.id);
    if (error) return toast('Błąd: ' + error.message, 'error');
    salons = salons.filter((x) => x.id !== s.id);
    toast('Salon usunięty', 'info');
    void refreshStats();
  }

  // ---- Użytkownicy ----
  async function toggleAdmin(u: AdminUser) {
    if (u.id === auth.user?.id && u.is_admin) {
      if (!confirm('Odebrać uprawnienia admina samemu sobie? Stracisz dostęp do tego panelu.')) return;
    }
    const { error } = await sb.rpc('katalog_set_admin', { target: u.id, make_admin: !u.is_admin });
    if (error) return toast('Błąd: ' + error.message, 'error');
    users = users.map((x) => (x.id === u.id ? { ...x, is_admin: !x.is_admin } : x));
    toast(u.is_admin ? 'Odebrano rolę admina' : 'Nadano rolę admina ✓', 'success');
    if (u.id === auth.user?.id && u.is_admin) void checkAndLoad();
  }

  async function refreshStats() {
    const { data } = await sb.rpc('katalog_admin_stats');
    if (data) stats = data as unknown as Stats;
  }

  function expiryLabel(j: JobListing): string {
    if (!j.expires_at) return '';
    const diff = new Date(j.expires_at).getTime() - Date.now();
    if (diff <= 0) return '⛔ wygasło';
    return `⏳ ${Math.ceil(diff / 86400000)} dni`;
  }

  async function logout() {
    await sb.auth.signOut();
    isAdmin = null;
    checkedFor = null;
  }
</script>

<svelte:head><title>Panel administratora — BeautyKatalog</title><meta name="robots" content="noindex" /></svelte:head>

{#if !auth.ready}
  <Spinner />
{:else if !auth.user}
  <AuthForm title="Panel administratora" subtitle="Zaloguj się kontem z uprawnieniami administratora." backHref="/" backLabel="← Strona główna" />
{:else if isAdmin === null}
  <Spinner />
{:else if !isAdmin}
  <main class="bk-container" style="max-width:520px;padding:4rem 1rem;text-align:center">
    <div class="bk-card" style="padding:2.5rem">
      <h1 style="font-size:1.3rem;margin-bottom:.5rem">Brak dostępu</h1>
      <p style="font-size:.9rem;color:var(--muted);margin-bottom:1.5rem">
        Konto <strong>{auth.user.email}</strong> nie ma uprawnień administratora katalogu.
      </p>
      <button class="bk-btn bk-btn-outline" onclick={logout}>Wyloguj</button>
    </div>
  </main>
{:else}
  <PanelShell
    title={panelTitle}
    breadcrumb="Panel administratora"
    nav={navGroups}
    active={activeTab}
    accent="gold"
    userName="Administrator"
    userMeta={auth.user.email}
    searchPlaceholder="Szukaj salonu, użytkownika…"
    onselect={(id) => (activeTab = id as typeof activeTab)}
    onlogout={logout}
  >
    {#if loading}
      <Spinner />
    {:else if activeTab === 'stats'}
      {#if stats}
        <div class="akpis">
          <div class="akpi">
            <span class="akpi-l">Salony aktywne</span>
            <span class="akpi-v">{stats.salons_active}</span>
            <span class="akpi-h">z {stats.salons_total} w katalogu</span>
          </div>
          <div class="akpi">
            <span class="akpi-l">Ogłoszenia aktywne</span>
            <span class="akpi-v">{stats.jobs_active}</span>
            <span class="akpi-h">z {stats.jobs_total} łącznie</span>
          </div>
          <div class="akpi">
            <span class="akpi-l">Użytkownicy</span>
            <span class="akpi-v">{stats.users_total}</span>
            <span class="akpi-h">konta w katalogu</span>
          </div>
          <div class="akpi akpi-dark">
            <span class="akpi-l">Przychód</span>
            <span class="akpi-v">{stats.revenue_pln} zł</span>
            <span class="akpi-h">z {stats.jobs_paid} opłaconych ogłoszeń</span>
          </div>
        </div>

        <div class="adash-row">
          <div class="adash-card">
            <div class="adash-head">
              <h3>Kolejka moderacji</h3>
              {#if pendingCount}<span class="adash-badge">{pendingCount} do akceptacji</span>{/if}
            </div>
            {#if pendingCount}
              <p class="adash-note">Ogłoszenia oczekujące na akceptację przed publikacją.</p>
              <button type="button" class="bk-btn bk-btn-primary" style="align-self:flex-start" onclick={() => (activeTab = 'jobs')}>Przejdź do moderacji</button>
            {:else}
              <div class="adash-empty">Brak ogłoszeń do moderacji — wszystko na bieżąco.</div>
            {/if}
          </div>
          <div class="adash-card">
            <div class="adash-head"><h3>Skróty</h3></div>
            <div class="adash-actions">
              <button type="button" onclick={() => (activeTab = 'jobs')}>Ogłoszenia i moderacja</button>
              <button type="button" onclick={() => (activeTab = 'salons')}>Zarządzaj salonami</button>
              <button type="button" onclick={() => (activeTab = 'users')}>Użytkownicy i role</button>
            </div>
          </div>
        </div>
      {/if}

    {:else if activeTab === 'jobs'}
      <div class="jobs-head">
        <div class="subfilter">
          {#each jobFilters as f}
            <button class:on={jobFilter === f.id} onclick={() => (jobFilter = f.id)}>{f.label}</button>
          {/each}
        </div>
        <button class="bk-btn bk-btn-primary sm" onclick={toggleNewJob}>
          {showNewJob ? '× Anuluj' : '+ Dodaj ogłoszenie'}
        </button>
      </div>

      {#if showNewJob}
        <div class="bk-card newjob">
          <h3 class="newjob-title">Nowe ogłoszenie (dodaje administrator)</h3>
          <div class="nj-grid">
            <div class="nj-field">
              <span class="bk-label">Typ *</span>
              <div style="display:flex;gap:.5rem">
                <button class="type-btn" class:on={newJob.type === 'hiring'} onclick={() => (newJob.type = 'hiring')}>💼 Zatrudnię</button>
                <button class="type-btn" class:on={newJob.type === 'looking'} onclick={() => (newJob.type = 'looking')}>🙋 Szukam pracy</button>
              </div>
            </div>
            <div class="nj-field nj-full"><label class="bk-label" for="nj-title">Stanowisko *</label><input id="nj-title" class="bk-input" bind:value={newJob.title} placeholder="Fryzjer, Kosmetolog..." /></div>
            <div class="nj-field"><label class="bk-label" for="nj-city">Miasto *</label><input id="nj-city" class="bk-input" bind:value={newJob.city} placeholder="Warszawa" /></div>
            <div class="nj-field"><label class="bk-label" for="nj-voi">Województwo</label>
              <select id="nj-voi" class="bk-input" bind:value={newJob.voivodeship}>{#each VOIVODESHIPS as v}<option value={v}>{v}</option>{/each}</select>
            </div>
            <div class="nj-field nj-full"><label class="bk-label" for="nj-desc">Opis</label><textarea id="nj-desc" class="bk-input" rows="3" style="resize:vertical" bind:value={newJob.description}></textarea></div>
            <div class="nj-field"><label class="bk-label" for="nj-sf">Wynagrodzenie od (zł)</label><input id="nj-sf" type="number" min="0" class="bk-input" bind:value={newJob.salary_from} /></div>
            <div class="nj-field"><label class="bk-label" for="nj-st">Wynagrodzenie do (zł)</label><input id="nj-st" type="number" min="0" class="bk-input" bind:value={newJob.salary_to} /></div>
            <div class="nj-field"><label class="bk-label" for="nj-emp">Forma zatrudnienia</label>
              <select id="nj-emp" class="bk-input" bind:value={newJob.employment}>
                <option value="">— nie podaję —</option>
                <option value="uop">Umowa o pracę</option>
                <option value="b2b">B2B</option>
                <option value="zlecenie">Umowa zlecenie</option>
                <option value="dowolna">Dowolna</option>
              </select>
            </div>
            <div class="nj-field"><label class="bk-label" for="nj-status">Status</label>
              <select id="nj-status" class="bk-input" bind:value={newJob.status}>
                <option value="active">✅ Opublikowane od razu</option>
                <option value="draft">📝 Szkic (ukryte)</option>
                <option value="closed">🔒 Zamknięte</option>
              </select>
            </div>
            <div class="nj-field"><label class="bk-label" for="nj-phone">Telefon *</label><input id="nj-phone" type="tel" class="bk-input" bind:value={newJob.phone} placeholder="+48 600 000 000" /></div>
            <div class="nj-field"><label class="bk-label" for="nj-email">Email *</label><input id="nj-email" type="email" class="bk-input" bind:value={newJob.email} placeholder="kontakt@email.pl" /></div>
            {#if newJob.status === 'active'}
              <div class="nj-field"><label class="bk-label" for="nj-price">Cena (zł)</label><input id="nj-price" type="number" min="0" class="bk-input" bind:value={newJob.price} /></div>
              <div class="nj-field"><label class="bk-label" for="nj-days">Ważność (dni)</label><input id="nj-days" type="number" min="1" class="bk-input" bind:value={newJob.days} /></div>
            {/if}
          </div>
          <div class="nj-actions">
            <button class="bk-btn bk-btn-primary sm" disabled={savingNew} onclick={createJob}>💾 {savingNew ? 'Zapisuję...' : 'Dodaj ogłoszenie'}</button>
            <button class="bk-btn bk-btn-outline sm" onclick={toggleNewJob}>Anuluj</button>
          </div>
        </div>
      {/if}

      {#if !visibleJobs.length}
        <p class="empty">Brak ogłoszeń w tym widoku.</p>
      {:else}
        {#each visibleJobs as j (j.id)}
          <div class="bk-card row">
            <div class="row-main">
              <div class="badges">
                <span>{typeLabel[j.type]}</span>
                <span class="pill" class:green={j.status === 'active'} class:gray={j.status !== 'active'}>{j.status}</span>
                <span class="pill" class:green={j.payment_status === 'paid'} class:red={j.payment_status !== 'paid'}>
                  {j.payment_status === 'paid' ? `opłacone${j.price_pln ? ' · ' + j.price_pln + ' zł' : ''}` : 'nieopłacone'}
                </span>
                {#if expiryLabel(j)}<span class="pill gray">{expiryLabel(j)}</span>{/if}
              </div>
              <p class="title">{j.title}</p>
              <p class="meta">📍 {j.city}{j.salary_from ? ' · ' + salaryLabel(j.salary_from, j.salary_to) : ''} · dodane {timeAgo(j.created_at)}</p>
            </div>
            <div class="actions">
              {#if j.status !== 'active' || j.payment_status !== 'paid'}
                {#if j.type === 'looking'}
                  <button class="bk-btn bk-btn-primary sm" onclick={() => approveFree(j)}>✅ Zaakceptuj (bezpłatnie)</button>
                {:else}
                  <button class="bk-btn bk-btn-primary sm" onclick={() => openPay(j)}>💳 Opłać i aktywuj</button>
                {/if}
              {:else}
                <button class="bk-btn bk-btn-outline sm" onclick={() => extendJob(j, 30)}>+30 dni</button>
                <button class="bk-btn bk-btn-outline sm" onclick={() => hideJob(j)}>Ukryj</button>
              {/if}
              <button class="bk-btn danger sm" onclick={() => deleteJob(j)}>Usuń</button>
            </div>
            {#if payJobId === j.id}
              <div class="paybox">
                <label>Kwota (zł)<input class="bk-input" type="number" min="0" bind:value={payPrice} /></label>
                <label>Ważność (dni)<input class="bk-input" type="number" min="1" bind:value={payDays} /></label>
                <button class="bk-btn bk-btn-primary sm" onclick={confirmActivate}>Potwierdź</button>
                <button class="bk-btn bk-btn-outline sm" onclick={() => (payJobId = null)}>Anuluj</button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}

    {:else if activeTab === 'salons'}
      {#if !salons.length}
        <p class="empty">Brak salonów.</p>
      {:else}
        {#each salons as s (s.id)}
          <div class="bk-card row">
            <div class="row-main">
              <div class="badges">
                <span class="pill" class:green={s.status === 'active'} class:gray={s.status !== 'active'}>{s.status}</span>
              </div>
              <p class="title">{s.name}</p>
              <p class="meta">📍 {s.city}{s.voivodeship ? ', ' + s.voivodeship : ''} · dodany {timeAgo(s.created_at)}</p>
            </div>
            <div class="actions">
              <a class="bk-btn bk-btn-outline sm" href="/salon/{s.id}" target="_blank" rel="noopener">Podgląd</a>
              <button class="bk-btn bk-btn-outline sm" onclick={() => toggleSalon(s)}>{s.status === 'active' ? 'Ukryj' : 'Pokaż'}</button>
              <button class="bk-btn danger sm" onclick={() => deleteSalon(s)}>Usuń</button>
            </div>
          </div>
        {/each}
      {/if}

    {:else if activeTab === 'users'}
      {#if !users.length}
        <p class="empty">Brak użytkowników powiązanych z katalogiem.</p>
      {:else}
        {#each users as u (u.id)}
          <div class="bk-card row">
            <div class="row-main">
              <div class="badges">
                {#if u.is_admin}<span class="pill green">admin</span>{/if}
              </div>
              <p class="title">{u.email}</p>
              <p class="meta">{u.salons_count} salon(y) · {u.jobs_count} ogłosz. · konto {timeAgo(u.created_at)}</p>
            </div>
            <div class="actions">
              <button class="bk-btn sm" class:danger={u.is_admin} class:bk-btn-outline={!u.is_admin} onclick={() => toggleAdmin(u)}>
                {u.is_admin ? 'Odbierz admina' : 'Nadaj admina'}
              </button>
            </div>
          </div>
        {/each}
      {/if}
    {/if}
  </PanelShell>
{/if}

<style>
  /* PULPIT ADMINA */
  .akpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }
  .akpi {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .akpi-dark {
    background: var(--sidebar-bg);
  }
  .akpi-l {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 500;
  }
  .akpi-dark .akpi-l {
    color: var(--gold);
  }
  .akpi-v {
    font-family: var(--serif);
    font-size: 32px;
    line-height: 1;
    color: var(--ink);
  }
  .akpi-dark .akpi-v {
    color: var(--porcelain);
  }
  .akpi-h {
    font-size: 12px;
    color: var(--ink-3);
  }
  .adash-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .adash-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .adash-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .adash-head h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }
  .adash-badge {
    background: var(--err-bg);
    color: var(--err-fg);
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
  }
  .adash-note {
    font-size: 13px;
    color: var(--ink-2);
  }
  .adash-empty {
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    padding: 22px;
    text-align: center;
    font-size: 13.5px;
    color: var(--ink-3);
  }
  .adash-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .adash-actions button {
    text-align: left;
    background: var(--porcelain);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 11px 14px;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink);
    cursor: pointer;
    transition: 0.15s;
  }
  .adash-actions button:hover {
    border-color: var(--gold);
  }
  @media (max-width: 900px) {
    .akpis {
      grid-template-columns: 1fr 1fr;
    }
    .adash-row {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 560px) {
    .akpis {
      grid-template-columns: 1fr;
    }
  }
  .jobs-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  .subfilter {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .newjob {
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.25rem;
  }
  .newjob-title {
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }
  .nj-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }
  .nj-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .nj-full {
    grid-column: 1 / -1;
  }
  .type-btn {
    flex: 1;
    padding: 0.5rem;
    border: 1.5px solid var(--border);
    border-radius: 0.6rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    background: #fff;
    color: var(--muted);
  }
  .type-btn.on {
    background: var(--v);
    color: #fff;
    border-color: var(--v);
  }
  .nj-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }
  @media (max-width: 560px) {
    .nj-grid {
      grid-template-columns: 1fr;
    }
  }
  .subfilter button {
    padding: 0.35rem 0.8rem;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--muted);
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.76rem;
    cursor: pointer;
  }
  .subfilter button.on {
    background: var(--v);
    color: #fff;
    border-color: var(--v);
  }
  .row {
    padding: 1rem 1.25rem;
    margin-bottom: 0.65rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .row-main {
    flex: 1;
    min-width: 200px;
  }
  .badges {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 0.3rem;
    font-size: 0.7rem;
  }
  .pill {
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .pill.green {
    background: #dcfce7;
    color: #15803d;
  }
  .pill.red {
    background: #fee2e2;
    color: #dc2626;
  }
  .pill.gray {
    background: var(--vl);
    color: var(--muted);
  }
  .title {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 0.1rem;
  }
  .meta {
    font-size: 0.78rem;
    color: var(--muted);
  }
  .actions {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
  }
  .sm {
    padding: 0.35rem 0.7rem;
    font-size: 0.76rem;
  }
  .paybox {
    width: 100%;
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    flex-wrap: wrap;
    padding-top: 0.85rem;
    margin-top: 0.5rem;
    border-top: 1px solid var(--border);
  }
  .paybox label {
    display: flex;
    flex-direction: column;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--muted);
    gap: 0.25rem;
  }
  .paybox input {
    width: 120px;
  }
  .danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1.5px solid #fca5a5;
  }
  .empty {
    font-size: 0.875rem;
    color: var(--muted);
  }
</style>
