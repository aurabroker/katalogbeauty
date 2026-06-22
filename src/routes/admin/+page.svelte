<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { salaryLabel, timeAgo } from '$lib/utils';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { JobListing, Salon, JobType } from '$lib/database.types';

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
  const tabs = [
    { id: 'stats', label: '📊 Statystyki' },
    { id: 'jobs', label: '💼 Ogłoszenia' },
    { id: 'salons', label: '🏠 Salony' },
    { id: 'users', label: '👤 Użytkownicy' }
  ] as const;

  let stats = $state<Stats | null>(null);
  let jobs = $state<JobListing[]>([]);
  let salons = $state<Salon[]>([]);
  let users = $state<AdminUser[]>([]);

  // inline panel aktywacji ogłoszenia
  let payJobId = $state<string | null>(null);
  let payPrice = $state('50');
  let payDays = $state('30');

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
    const next = s.status === 'active' ? 'paused' : 'active';
    const { data, error } = await sb.from('salons').update({ status: next }).eq('id', s.id).select().single();
    if (error || !data) return toast('Błąd: ' + (error?.message ?? ''), 'error');
    salons = salons.map((x) => (x.id === s.id ? (data as Salon) : x));
    toast(next === 'active' ? 'Salon widoczny ✓' : 'Salon ukryty', 'info');
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
  <main class="bk-container" style="padding-top:2rem;padding-bottom:4rem;max-width:1000px">
    <div class="topbar">
      <div>
        <h1>Panel administratora</h1>
        <p class="email">{auth.user.email} · <span style="color:var(--v);font-weight:700">admin</span></p>
      </div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a href="/" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">← Strona główna</a>
        <button class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem" onclick={logout}>Wyloguj</button>
      </div>
    </div>

    <div class="tabs">
      {#each tabs as t}
        <button class:on={activeTab === t.id} onclick={() => (activeTab = t.id)}>{t.label}</button>
      {/each}
    </div>

    {#if loading}
      <Spinner />
    {:else if activeTab === 'stats'}
      {#if stats}
        <div class="cards">
          <div class="stat"><span class="num">{stats.salons_total}</span><span class="lbl">Salony łącznie</span></div>
          <div class="stat"><span class="num">{stats.salons_active}</span><span class="lbl">Salony aktywne</span></div>
          <div class="stat"><span class="num">{stats.jobs_total}</span><span class="lbl">Ogłoszenia łącznie</span></div>
          <div class="stat"><span class="num">{stats.jobs_active}</span><span class="lbl">Ogłoszenia aktywne</span></div>
          <div class="stat"><span class="num">{stats.jobs_paid}</span><span class="lbl">Ogłoszenia opłacone</span></div>
          <div class="stat"><span class="num" style="color:var(--v)">{stats.revenue_pln} zł</span><span class="lbl">Przychód</span></div>
          <div class="stat"><span class="num">{stats.users_total}</span><span class="lbl">Użytkownicy</span></div>
        </div>
      {/if}

    {:else if activeTab === 'jobs'}
      {#if !jobs.length}
        <p class="empty">Brak ogłoszeń.</p>
      {:else}
        {#each jobs as j (j.id)}
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
                <button class="bk-btn bk-btn-primary sm" onclick={() => openPay(j)}>💳 Opłać i aktywuj</button>
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
  </main>

  <Footer><span style="color:var(--muted)">© 2026 BeautyKatalog · panel administratora</span></Footer>
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .topbar h1 {
    font-size: 1.4rem;
    margin-bottom: 0.15rem;
  }
  .email {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .tabs button {
    padding: 0.5rem 0.9rem;
    border: none;
    background: var(--vl);
    color: var(--v);
    border-radius: 0.5rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
  }
  .tabs button.on {
    background: var(--v);
    color: #fff;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  .stat {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .stat .num {
    font-size: 1.6rem;
    font-weight: 800;
  }
  .stat .lbl {
    font-size: 0.78rem;
    color: var(--muted);
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
