<script>
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte.js';
  import { toast } from '$lib/stores/toast.svelte.js';
  import { VOIVODESHIPS } from '$lib/utils';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let myJobs = $state([]);
  let loadingData = $state(false);
  let loadedFor = null;

  let editingId = $state(null);
  let saving = $state(false);
  let form = $state(emptyForm());

  const statusLabel = { active: '✅ Aktywne', draft: '📝 Szkic', closed: '🔒 Zamknięte' };
  const typeLabel = { hiring: '💼 Zatrudnię', looking: '🙋 Szukam pracy' };
  const typeColor = { hiring: 'var(--v)', looking: '#0891b2' };

  function emptyForm() {
    return {
      type: 'hiring', title: '', city: '', voivodeship: '', description: '',
      salary_from: '', salary_to: '', employment: '', phone: '', email: '', status: 'active'
    };
  }

  $effect(() => {
    const uid = auth.user?.id;
    if (!uid || loadedFor === uid) return;
    loadedFor = uid;
    loadMyJobs(uid);
  });

  async function loadMyJobs(uid) {
    loadingData = true;
    const { data } = await sb
      .from('job_listings')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false });
    loadingData = false;
    myJobs = data ?? [];
  }

  function editJob(id) {
    editingId = id;
    const j = myJobs.find((x) => x.id === id);
    form = {
      type: j.type ?? 'hiring',
      title: j.title ?? '',
      city: j.city ?? '',
      voivodeship: j.voivodeship ?? '',
      description: j.description ?? '',
      salary_from: j.salary_from ?? '',
      salary_to: j.salary_to ?? '',
      employment: j.employment ?? '',
      phone: j.phone ?? '',
      email: j.email ?? '',
      status: j.status ?? 'active'
    };
  }

  function cancelEdit() {
    editingId = null;
    form = emptyForm();
  }

  async function saveJob() {
    if (!form.title.trim() || !form.city.trim()) {
      toast('Wypełnij stanowisko i miasto', 'error');
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      toast('Podaj telefon lub email', 'error');
      return;
    }
    const payload = {
      owner_id: auth.user.id,
      type: form.type,
      title: form.title.trim(),
      city: form.city.trim(),
      voivodeship: form.voivodeship || null,
      description: form.description.trim() || null,
      salary_from: parseFloat(form.salary_from) || null,
      salary_to: parseFloat(form.salary_to) || null,
      employment: form.employment || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      status: form.status
    };
    saving = true;
    let error, data;
    if (editingId) {
      ({ error, data } = await sb.from('job_listings').update(payload).eq('id', editingId).select().single());
    } else {
      ({ error, data } = await sb.from('job_listings').insert(payload).select().single());
    }
    saving = false;
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    if (editingId) {
      myJobs = myJobs.map((j) => (j.id === editingId ? data : j));
    } else {
      myJobs = [data, ...myJobs];
    }
    toast(editingId ? 'Ogłoszenie zaktualizowane ✓' : 'Ogłoszenie opublikowane ✓', 'success');
    cancelEdit();
  }

  async function deleteJob(id) {
    if (!confirm('Usunąć to ogłoszenie?')) return;
    const { error } = await sb.from('job_listings').delete().eq('id', id);
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    myJobs = myJobs.filter((j) => j.id !== id);
    if (editingId === id) cancelEdit();
    toast('Ogłoszenie usunięte', 'info');
  }

  async function logout() {
    await sb.auth.signOut();
    myJobs = [];
    loadedFor = null;
    cancelEdit();
  }
</script>

<svelte:head><title>Moje ogłoszenia — BeautyKatalog</title></svelte:head>

{#if !auth.ready}
  <Spinner />
{:else if !auth.user}
  <AuthForm
    title="Panel ogłoszeń"
    subtitle="Zaloguj się lub utwórz konto, aby dodawać ogłoszenia."
    backHref="/jobs"
    backLabel="← Lista ogłoszeń"
  />
{:else}
  <main class="bk-container" style="padding-top:2rem;padding-bottom:4rem;max-width:860px">
    <div class="topbar">
      <div>
        <h1>Moje ogłoszenia</h1>
        <p class="email">{auth.user.email}</p>
      </div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a href="/jobs" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem">← Ogłoszenia</a>
        <button class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem" onclick={logout}>Wyloguj</button>
      </div>
    </div>

    <div class="body">
      <!-- LISTA -->
      <div>
        <h2 class="col-title">Twoje ogłoszenia</h2>
        {#if loadingData}
          <Spinner />
        {:else if !myJobs.length}
          <p style="font-size:.875rem;color:var(--muted)">Brak ogłoszeń — wypełnij formularz obok.</p>
        {:else}
          {#each myJobs as j (j.id)}
            <div class="bk-card job-item" class:active={editingId === j.id} onclick={() => editJob(j.id)} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && editJob(j.id)}>
              <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem;flex-wrap:wrap">
                <span style="font-size:.68rem;font-weight:800;color:{typeColor[j.type]}">{typeLabel[j.type]}</span>
                <span style="font-size:.68rem;color:var(--muted)">{statusLabel[j.status]}</span>
              </div>
              <p style="font-weight:700;font-size:.9rem;margin-bottom:.15rem">{j.title}</p>
              <p style="font-size:.78rem;color:var(--muted)">📍 {j.city}</p>
              <div style="margin-top:.65rem;display:flex;gap:.4rem">
                <button class="bk-btn bk-btn-outline" style="padding:.3rem .65rem;font-size:.75rem" onclick={(e) => { e.stopPropagation(); editJob(j.id); }}>Edytuj</button>
                <button class="bk-btn danger" style="padding:.3rem .65rem;font-size:.75rem" onclick={(e) => { e.stopPropagation(); deleteJob(j.id); }}>Usuń</button>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- FORMULARZ -->
      <div>
        <div class="form-sticky">
          <h2 class="col-title">{editingId ? 'Edytujesz ogłoszenie' : 'Nowe ogłoszenie'}</h2>
          <div class="bk-card" style="padding:1.5rem;display:grid;gap:1rem">
            <div>
              <span class="bk-label">Typ ogłoszenia *</span>
              <div style="display:flex;gap:.5rem">
                <button class="type-btn" class:on-hiring={form.type === 'hiring'} onclick={() => (form.type = 'hiring')}>💼 Zatrudnię</button>
                <button class="type-btn" class:on-looking={form.type === 'looking'} onclick={() => (form.type = 'looking')}>🙋 Szukam pracy</button>
              </div>
            </div>

            <div>
              <label class="bk-label" for="jf-title">Stanowisko *</label>
              <input id="jf-title" class="bk-input" bind:value={form.title} placeholder="Fryzjer, Kosmetolog, Wizażysta..." />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
              <div><label class="bk-label" for="jf-city">Miasto *</label><input id="jf-city" class="bk-input" bind:value={form.city} placeholder="Warszawa" /></div>
              <div><label class="bk-label" for="jf-voi">Województwo</label>
                <select id="jf-voi" class="bk-input" bind:value={form.voivodeship}>
                  {#each VOIVODESHIPS as v}<option value={v}>{v}</option>{/each}
                </select>
              </div>
            </div>

            <div>
              <label class="bk-label" for="jf-desc">Opis</label>
              <textarea id="jf-desc" class="bk-input" rows="4" style="resize:vertical" bind:value={form.description} placeholder="Wymagania, warunki, zakres obowiązków..."></textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
              <div><label class="bk-label" for="jf-sf">Wynagrodzenie od (zł)</label><input id="jf-sf" type="number" min="0" class="bk-input" bind:value={form.salary_from} placeholder="4000" /></div>
              <div><label class="bk-label" for="jf-st">Wynagrodzenie do (zł)</label><input id="jf-st" type="number" min="0" class="bk-input" bind:value={form.salary_to} placeholder="7000" /></div>
            </div>

            <div>
              <label class="bk-label" for="jf-emp">Forma zatrudnienia</label>
              <select id="jf-emp" class="bk-input" bind:value={form.employment}>
                <option value="">— nie podaję —</option>
                <option value="uop">Umowa o pracę</option>
                <option value="b2b">B2B</option>
                <option value="zlecenie">Umowa zlecenie</option>
                <option value="dowolna">Dowolna</option>
              </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
              <div><label class="bk-label" for="jf-phone">Telefon</label><input id="jf-phone" type="tel" class="bk-input" bind:value={form.phone} placeholder="+48 600 000 000" /></div>
              <div><label class="bk-label" for="jf-email">Email</label><input id="jf-email" type="email" class="bk-input" bind:value={form.email} placeholder="kontakt@email.pl" /></div>
            </div>
            <p style="font-size:.72rem;color:var(--muted);margin-top:-.5rem">Podaj przynajmniej jedno z pól kontaktowych.</p>

            <div>
              <label class="bk-label" for="jf-status">Status</label>
              <select id="jf-status" class="bk-input" bind:value={form.status}>
                <option value="active">Aktywne (widoczne)</option>
                <option value="draft">Szkic (ukryte)</option>
                <option value="closed">Zamknięte</option>
              </select>
            </div>

            <div style="display:flex;gap:.65rem;flex-wrap:wrap;padding-top:.25rem;border-top:1px solid var(--border)">
              <button class="bk-btn bk-btn-primary" style="flex:1" disabled={saving} onclick={saveJob}>
                💾 {saving ? 'Zapisuję...' : editingId ? 'Zapisz zmiany' : 'Opublikuj ogłoszenie'}
              </button>
              {#if editingId}<button class="bk-btn bk-btn-outline" onclick={cancelEdit}>Anuluj</button>{/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <Footer><span style="color:var(--muted)">© 2026 BeautyKatalog</span></Footer>
{/if}

<style>
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .topbar h1 {
    font-size: 1.4rem;
    margin-bottom: 0.15rem;
  }
  .email {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
  }
  .col-title {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin-bottom: 1rem;
  }
  .job-item {
    padding: 1rem;
    margin-bottom: 0.65rem;
    cursor: pointer;
    transition: 0.15s;
    border: 2px solid var(--border);
  }
  .job-item:hover,
  .job-item.active {
    border-color: var(--v);
  }
  .form-sticky {
    position: sticky;
    top: 80px;
  }
  .type-btn {
    flex: 1;
    padding: 0.55rem;
    border: 1.5px solid var(--border);
    border-radius: 0.6rem;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    background: #fff;
    color: var(--muted);
  }
  .type-btn.on-hiring {
    background: var(--v);
    color: #fff;
  }
  .type-btn.on-looking {
    background: #0891b2;
    color: #fff;
  }
  .danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1.5px solid #fca5a5;
  }
  @media (max-width: 700px) {
    .body {
      grid-template-columns: 1fr;
    }
    .form-sticky {
      position: static;
    }
  }
</style>
