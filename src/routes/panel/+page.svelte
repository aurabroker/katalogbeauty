<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { slug, VOIVODESHIPS, priceLabel, hoursToText } from '$lib/utils';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { Database, SalonWithRelations, SalonService, SalonPhoto, Json } from '$lib/database.types';

  let currentSalon = $state<SalonWithRelations | null>(null);
  let services = $state<SalonService[]>([]);
  let photos = $state<SalonPhoto[]>([]);
  let loadingData = $state(false);
  let loadedFor: string | null = null; // user.id, dla którego już wczytano dane

  let activeTab = $state('salon');
  const tabs = [
    { id: 'salon', label: '📋 Dane salonu' },
    { id: 'services', label: '✂️ Zabiegi' },
    { id: 'photos', label: '📷 Zdjęcia' }
  ];

  // formularz salonu
  let form = $state(emptyForm());
  let savingSalon = $state(false);
  let deleteOpen = $state(false);

  // modal zabiegu
  let svcOpen = $state(false);
  let svcEditingId = $state<string | null>(null);
  let svcForm = $state({ service_name: '', price_from: '', price_to: '', duration_min: '', is_available: 'true' });
  let savingSvc = $state(false);

  let uploading = $state(false);

  function emptyForm() {
    return {
      name: '', tagline: '', description: '', status: 'active',
      city: '', street: '', postal_code: '', voivodeship: '',
      phone: '', email_contact: '', website: '',
      instagram_url: '', facebook_url: '', tiktok_url: '',
      nip: '', regon: '', hours: ''
    };
  }

  function populateForm(s: SalonWithRelations) {
    form = {
      name: s.name ?? '', tagline: s.tagline ?? '', description: s.description ?? '',
      status: s.status ?? 'active', city: s.city ?? '', street: s.street ?? '',
      postal_code: s.postal_code ?? '', voivodeship: s.voivodeship ?? '',
      phone: s.phone ?? '', email_contact: s.email_contact ?? '', website: s.website ?? '',
      instagram_url: s.instagram_url ?? '', facebook_url: s.facebook_url ?? '', tiktok_url: s.tiktok_url ?? '',
      nip: s.nip ?? '', regon: s.regon ?? '', hours: hoursToText(s.opening_hours)
    };
  }

  // wczytaj dane salonu, gdy znamy użytkownika
  $effect(() => {
    const uid = auth.user?.id;
    if (!uid || loadedFor === uid) return;
    loadedFor = uid;
    loadSalon(uid);
  });

  async function loadSalon(uid: string) {
    loadingData = true;
    const { data, error } = await sb
      .from('salons')
      .select('*,salon_services(*),salon_photos(*)')
      .eq('owner_id', uid)
      .maybeSingle();
    loadingData = false;
    if (error) {
      console.error(error);
      return;
    }
    const salon = data as unknown as SalonWithRelations | null;
    if (salon) {
      currentSalon = salon;
      services = salon.salon_services ?? [];
      photos = salon.salon_photos ?? [];
      populateForm(salon);
    } else {
      currentSalon = null;
      services = [];
      photos = [];
      form = emptyForm();
    }
  }

  async function logout() {
    await sb.auth.signOut();
    currentSalon = null;
    services = [];
    photos = [];
    loadedFor = null;
  }

  /* ── ZAPIS SALONU ── */
  async function saveSalon() {
    if (!auth.user) return;
    if (!form.name.trim() || !form.city.trim()) {
      toast('Wypełnij nazwę i miasto', 'error');
      return;
    }
    let opening_hours: Json | null = null;
    if (form.hours.trim()) {
      try {
        opening_hours = JSON.parse(form.hours);
      } catch {
        opening_hours = { text: form.hours.trim() };
      }
    }
    const payload = {
      owner_id: auth.user.id,
      name: form.name.trim(),
      slug: slug(form.name),
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      city: form.city.trim(),
      street: form.street.trim() || null,
      postal_code: form.postal_code.trim() || null,
      voivodeship: form.voivodeship || null,
      phone: form.phone.trim() || null,
      email_contact: form.email_contact.trim() || null,
      website: form.website.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
      nip: form.nip.trim() || null,
      regon: form.regon.trim() || null,
      opening_hours,
      status: form.status as Database['public']['Tables']['salons']['Row']['status']
    } satisfies Database['public']['Tables']['salons']['Insert'];

    savingSalon = true;
    let error;
    if (currentSalon) {
      ({ error } = await sb.from('salons').update(payload).eq('id', currentSalon.id));
      if (!error) currentSalon = { ...currentSalon, ...payload };
    } else {
      const res = await sb.from('salons').insert(payload).select().single();
      error = res.error;
      if (!error) currentSalon = res.data;
    }
    savingSalon = false;
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    toast('Salon zapisany ✓', 'success');
  }

  async function deleteSalon() {
    if (!currentSalon) return;
    const { error } = await sb.from('salons').delete().eq('id', currentSalon.id);
    deleteOpen = false;
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    currentSalon = null;
    services = [];
    photos = [];
    form = emptyForm();
    toast('Salon usunięty', 'info');
  }

  /* ── ZABIEGI ── */
  function openServiceModal(id: string | null) {
    svcEditingId = id;
    const svc = id ? services.find((s) => s.id === id) : null;
    svcForm = {
      service_name: svc?.service_name ?? '',
      price_from: svc?.price_from != null ? String(svc.price_from) : '',
      price_to: svc?.price_to != null ? String(svc.price_to) : '',
      duration_min: svc?.duration_min != null ? String(svc.duration_min) : '',
      is_available: String(svc?.is_available ?? true)
    };
    svcOpen = true;
  }

  async function saveService() {
    if (!currentSalon) return;
    if (!svcForm.service_name.trim()) {
      toast('Podaj nazwę zabiegu', 'error');
      return;
    }
    const payload = {
      salon_id: currentSalon.id,
      service_name: svcForm.service_name.trim(),
      price_from: parseFloat(svcForm.price_from) || null,
      price_to: parseFloat(svcForm.price_to) || null,
      duration_min: parseInt(svcForm.duration_min) || null,
      is_available: svcForm.is_available === 'true'
    } satisfies Database['public']['Tables']['salon_services']['Insert'];
    savingSvc = true;
    let error, data;
    if (svcEditingId) {
      ({ error, data } = await sb.from('salon_services').update(payload).eq('id', svcEditingId).select().single());
    } else {
      ({ error, data } = await sb.from('salon_services').insert(payload).select().single());
    }
    savingSvc = false;
    if (error || !data) {
      if (error) toast('Błąd: ' + error.message, 'error');
      return;
    }
    if (svcEditingId) {
      services = services.map((s) => (s.id === svcEditingId ? data : s));
    } else {
      services = [...services, data];
    }
    svcOpen = false;
    toast('Zabieg zapisany ✓', 'success');
  }

  async function deleteService(id: string) {
    if (!confirm('Usunąć zabieg?')) return;
    const { error } = await sb.from('salon_services').delete().eq('id', id);
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    services = services.filter((s) => s.id !== id);
    toast('Zabieg usunięty', 'info');
  }

  /* ── ZDJĘCIA ── */
  async function uploadPhotos(e: Event) {
    if (!currentSalon) return;
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    uploading = true;
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast(`${file.name} > 5 MB`, 'error');
        continue;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${currentSalon.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await sb.storage.from('salon-photos').upload(path, file, { upsert: false });
      if (upErr) {
        toast('Błąd uploadu: ' + upErr.message, 'error');
        continue;
      }
      const { data: urlData } = sb.storage.from('salon-photos').getPublicUrl(path);
      const { data: rec, error: dbErr } = await sb
        .from('salon_photos')
        .insert({
          salon_id: currentSalon.id,
          url: urlData.publicUrl,
          storage_path: path,
          is_cover: photos.length === 0,
          sort_order: photos.length
        })
        .select()
        .single();
      if (dbErr) {
        toast('Błąd zapisu: ' + dbErr.message, 'error');
        continue;
      }
      photos = [...photos, rec];
    }
    uploading = false;
    input.value = '';
    toast('Zdjęcia przesłane ✓', 'success');
  }

  async function setCover(id: string) {
    if (!currentSalon) return;
    await sb.from('salon_photos').update({ is_cover: false }).eq('salon_id', currentSalon.id);
    await sb.from('salon_photos').update({ is_cover: true }).eq('id', id);
    photos = photos.map((p) => ({ ...p, is_cover: p.id === id }));
    toast('Okładka ustawiona ✓', 'success');
  }

  async function deletePhoto(id: string) {
    if (!confirm('Usunąć to zdjęcie?')) return;
    const photo = photos.find((p) => p.id === id);
    if (photo?.storage_path) await sb.storage.from('salon-photos').remove([photo.storage_path]);
    const { error } = await sb.from('salon_photos').delete().eq('id', id);
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    photos = photos.filter((p) => p.id !== id);
    if (photo?.is_cover && photos.length) {
      await sb.from('salon_photos').update({ is_cover: true }).eq('id', photos[0].id);
      photos = photos.map((p, i) => (i === 0 ? { ...p, is_cover: true } : p));
    }
    toast('Zdjęcie usunięte', 'info');
  }

  const sortedPhotos = $derived(
    [...photos].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)
  );
</script>

<svelte:head><title>Panel właściciela — BeautyKatalog</title></svelte:head>

{#if !auth.ready}
  <Spinner />
{:else if !auth.user}
  <AuthForm
    title="Panel właściciela"
    subtitle="Zaloguj się lub utwórz konto, aby zarządzać swoim salonem."
  />
{:else}
  <main class="bk-container" style="padding-top:2rem;padding-bottom:4rem">
    <div class="topbar">
      <div>
        <h1>Panel właściciela</h1>
        <p class="email">{auth.user.email}</p>
      </div>
      <button class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.4rem .9rem" onclick={logout}>Wyloguj</button>
    </div>

    <div class="tabs">
      {#each tabs as t}
        <button class="tab" class:on={activeTab === t.id} onclick={() => (activeTab = t.id)}>{t.label}</button>
      {/each}
    </div>

    {#if loadingData}
      <Spinner />
    {:else if activeTab === 'salon'}
      <!-- DANE SALONU -->
      <div style="max-width:720px">
        <div class="section-head">
          <h2>{currentSalon ? 'Dane salonu' : 'Dodaj swój salon'}</h2>
          {#if currentSalon}
            <button class="bk-btn danger" onclick={() => (deleteOpen = true)}>🗑 Usuń salon</button>
          {/if}
        </div>

        {@render section('Podstawowe informacje')}
        <div class="fg-2">
          <div class="fc"><label class="bk-label" for="f-name">Nazwa salonu *</label><input id="f-name" class="bk-input" bind:value={form.name} placeholder="Studio Urody Ewa" /></div>
          <div class="fc"><label class="bk-label" for="f-tag">Tagline</label><input id="f-tag" class="bk-input" bind:value={form.tagline} placeholder="Twoje piękno, nasza pasja" /></div>
          <div class="fc fc-full"><label class="bk-label" for="f-desc">Opis</label><textarea id="f-desc" class="bk-input" rows="4" style="resize:vertical" bind:value={form.description}></textarea></div>
          <div class="fc"><label class="bk-label" for="f-status">Status</label>
            <select id="f-status" class="bk-input" bind:value={form.status}>
              <option value="active">Aktywny (widoczny)</option>
              <option value="draft">Szkic (ukryty)</option>
              <option value="paused">Wstrzymany</option>
            </select>
          </div>
        </div>

        {@render section('Adres')}
        <div class="fg-2">
          <div class="fc"><label class="bk-label" for="f-city">Miasto *</label><input id="f-city" class="bk-input" bind:value={form.city} placeholder="Warszawa" /></div>
          <div class="fc"><label class="bk-label" for="f-street">Ulica i numer</label><input id="f-street" class="bk-input" bind:value={form.street} placeholder="Marszałkowska 10" /></div>
          <div class="fc"><label class="bk-label" for="f-postal">Kod pocztowy</label><input id="f-postal" class="bk-input" bind:value={form.postal_code} placeholder="00-001" /></div>
          <div class="fc"><label class="bk-label" for="f-voi">Województwo</label>
            <select id="f-voi" class="bk-input" bind:value={form.voivodeship}>
              {#each VOIVODESHIPS as v}<option value={v}>{v}</option>{/each}
            </select>
          </div>
        </div>

        {@render section('Kontakt')}
        <div class="fg-2">
          <div class="fc"><label class="bk-label" for="f-phone">Telefon</label><input id="f-phone" class="bk-input" bind:value={form.phone} placeholder="+48 600 000 000" /></div>
          <div class="fc"><label class="bk-label" for="f-email">Email</label><input id="f-email" type="email" class="bk-input" bind:value={form.email_contact} placeholder="salon@email.pl" /></div>
          <div class="fc fc-full"><label class="bk-label" for="f-www">Strona WWW</label><input id="f-www" class="bk-input" bind:value={form.website} placeholder="https://twojsalon.pl" /></div>
        </div>

        {@render section('Social media')}
        <div class="fg-2">
          <div class="fc"><label class="bk-label" for="f-ig">Instagram</label><input id="f-ig" class="bk-input" bind:value={form.instagram_url} placeholder="https://instagram.com/..." /></div>
          <div class="fc"><label class="bk-label" for="f-fb">Facebook</label><input id="f-fb" class="bk-input" bind:value={form.facebook_url} placeholder="https://facebook.com/..." /></div>
          <div class="fc"><label class="bk-label" for="f-tt">TikTok</label><input id="f-tt" class="bk-input" bind:value={form.tiktok_url} placeholder="https://tiktok.com/@..." /></div>
        </div>

        {@render section('Dane firmowe')}
        <div class="fg-2">
          <div class="fc"><label class="bk-label" for="f-nip">NIP</label><input id="f-nip" class="bk-input" bind:value={form.nip} placeholder="0000000000" /></div>
          <div class="fc"><label class="bk-label" for="f-regon">REGON</label><input id="f-regon" class="bk-input" bind:value={form.regon} placeholder="000000000" /></div>
        </div>

        {@render section('Godziny otwarcia')}
        <textarea class="bk-input" rows="5" style="resize:vertical;font-size:.875rem;max-width:360px" bind:value={form.hours} placeholder={'Pn–Pt: 9:00–19:00\nSb: 10:00–16:00\nNd: zamknięte'}></textarea>
        <p style="font-size:.72rem;color:var(--muted);margin-top:.4rem">Wpisz w dowolnym formacie tekstowym.</p>

        <div class="save-bar">
          <button class="bk-btn bk-btn-primary" style="min-width:180px" disabled={savingSalon} onclick={saveSalon}>
            💾 {savingSalon ? 'Zapisywanie...' : currentSalon ? 'Zapisz zmiany' : 'Dodaj salon'}
          </button>
        </div>
      </div>
    {:else if activeTab === 'services'}
      <!-- ZABIEGI -->
      {#if !currentSalon}
        <div class="bk-empty"><h3>Najpierw dodaj salon</h3></div>
      {:else}
        <div style="max-width:700px">
          <div class="section-head">
            <h2>Zabiegi i usługi</h2>
            <button class="bk-btn bk-btn-primary" style="font-size:.875rem" onclick={() => openServiceModal(null)}>+ Dodaj zabieg</button>
          </div>
          {#if !services.length}
            <div class="bk-empty"><h3>Brak zabiegów</h3><p>Dodaj pierwszy zabieg.</p></div>
          {:else}
            {#each services as svc (svc.id)}
              <div class="bk-card svc-item">
                <div style="flex:1;min-width:160px">
                  <p style="font-weight:700;font-size:.95rem">{svc.service_name}</p>
                  {#if !svc.is_available}<span style="font-size:.7rem;color:#dc2626;font-weight:700">niedostępny</span>{/if}
                </div>
                <div class="svc-meta">
                  {#if svc.duration_min}<span>⏱ {svc.duration_min} min</span>{/if}
                  {#if priceLabel(svc.price_from, svc.price_to)}<span style="font-weight:700;color:var(--navy)">💰 {priceLabel(svc.price_from, svc.price_to)}</span>{/if}
                </div>
                <div style="display:flex;gap:.5rem">
                  <button class="bk-btn bk-btn-outline" style="padding:.35rem .75rem;font-size:.8rem" onclick={() => openServiceModal(svc.id)}>Edytuj</button>
                  <button class="bk-btn danger" style="padding:.35rem .75rem;font-size:.8rem" onclick={() => deleteService(svc.id)}>Usuń</button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    {:else if activeTab === 'photos'}
      <!-- ZDJĘCIA -->
      {#if !currentSalon}
        <div class="bk-empty"><h3>Najpierw dodaj salon</h3></div>
      {:else}
        <div style="max-width:800px">
          <div class="section-head">
            <h2>Zdjęcia salonu</h2>
            <label class="bk-btn bk-btn-primary" style="cursor:pointer;font-size:.875rem">
              📤 Dodaj zdjęcia
              <input type="file" accept="image/*" multiple style="display:none" onchange={uploadPhotos} />
            </label>
          </div>
          <p style="font-size:.8rem;color:var(--muted);margin-bottom:1.25rem">
            Zaznacz „Okładka" przy zdjęciu wyświetlanym na liście salonów. Max 5 MB, formaty: JPG, PNG, WebP.
          </p>
          {#if uploading}
            <div class="bk-card" style="padding:.75rem 1rem;font-size:.85rem;margin-bottom:1rem">Przesyłanie...</div>
          {/if}
          {#if !photos.length}
            <div class="bk-empty"><h3>Brak zdjęć</h3><p>Dodaj pierwsze zdjęcie.</p></div>
          {:else}
            <div class="photos-grid">
              {#each sortedPhotos as p (p.id)}
                <div class="bk-card" style="overflow:hidden">
                  <img src={p.url} alt="Zdjęcie salonu" loading="lazy" style="width:100%;height:150px;object-fit:cover" />
                  <div class="photo-actions">
                    <label style="display:flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:700;cursor:pointer;color:{p.is_cover ? 'var(--v)' : 'var(--muted)'}">
                      <input type="radio" name="cover-photo" checked={p.is_cover} onchange={() => setCover(p.id)} />
                      Okładka
                    </label>
                    <button style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:1.3rem;line-height:1" title="Usuń" onclick={() => deletePhoto(p.id)}>×</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </main>

  <!-- MODAL: usuwanie salonu -->
  <Modal bind:open={deleteOpen}>
    <h3 style="margin-bottom:.75rem;color:#dc2626">Usuń salon</h3>
    <p style="font-size:.875rem;color:var(--muted);margin-bottom:1.5rem">Tej operacji nie można cofnąć.</p>
    <div style="display:flex;gap:.75rem">
      <button class="bk-btn" style="background:#dc2626;color:#fff" onclick={deleteSalon}>Tak, usuń</button>
      <button class="bk-btn bk-btn-outline" onclick={() => (deleteOpen = false)}>Anuluj</button>
    </div>
  </Modal>

  <!-- MODAL: zabieg -->
  <Modal bind:open={svcOpen}>
    <h3 style="margin-bottom:1.25rem">{svcEditingId ? 'Edytuj zabieg' : 'Nowy zabieg'}</h3>
    <div style="display:grid;gap:.85rem">
      <div>
        <label class="bk-label" for="sv-name">Nazwa zabiegu *</label>
        <input id="sv-name" class="bk-input" bind:value={svcForm.service_name} placeholder="Manicure hybrydowy" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.75rem">
        <div><label class="bk-label" for="sv-pf">Cena od (zł)</label><input id="sv-pf" type="number" min="0" step="0.01" class="bk-input" bind:value={svcForm.price_from} /></div>
        <div><label class="bk-label" for="sv-pt">Cena do (zł)</label><input id="sv-pt" type="number" min="0" step="0.01" class="bk-input" bind:value={svcForm.price_to} /></div>
        <div><label class="bk-label" for="sv-dur">Czas (min)</label><input id="sv-dur" type="number" min="0" class="bk-input" bind:value={svcForm.duration_min} /></div>
      </div>
      <div>
        <label class="bk-label" for="sv-av">Dostępność</label>
        <select id="sv-av" class="bk-input" bind:value={svcForm.is_available}>
          <option value="true">Dostępny</option>
          <option value="false">Niedostępny</option>
        </select>
      </div>
    </div>
    <div style="margin-top:1.25rem;display:flex;gap:.75rem">
      <button class="bk-btn bk-btn-primary" disabled={savingSvc} onclick={saveService}>💾 {savingSvc ? 'Zapisuję...' : svcEditingId ? 'Zapisz' : 'Dodaj'}</button>
      <button class="bk-btn bk-btn-outline" onclick={() => (svcOpen = false)}>Anuluj</button>
    </div>
  </Modal>

  <Footer><span style="color:var(--muted)">© 2026 BeautyKatalog</span></Footer>
{/if}

{#snippet section(title: string)}
  <h3 class="sec">{title}</h3>
{/snippet}

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
    font-size: 1.5rem;
    margin-bottom: 0.15rem;
  }
  .email {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .tabs {
    display: flex;
    gap: 0.25rem;
    border-bottom: 2px solid var(--border);
    margin-bottom: 1.75rem;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tab {
    padding: 0.5rem 1.1rem;
    border: none;
    background: none;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    margin-bottom: -2px;
    transition: 0.15s;
  }
  .tab.on {
    color: var(--v);
    border-bottom-color: var(--v);
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .section-head h2 {
    font-size: 1.15rem;
  }
  .sec {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
    margin: 1.75rem 0 0.85rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }
  .danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1.5px solid #fca5a5;
    font-size: 0.8rem;
    padding: 0.35rem 0.85rem;
  }
  .fg-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .fc {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .fc-full {
    grid-column: 1 / -1;
  }
  .save-bar {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }
  .svc-item {
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.65rem;
    flex-wrap: wrap;
  }
  .svc-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 1rem;
  }
  .photo-actions {
    padding: 0.6rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  @media (max-width: 560px) {
    .fg-2 {
      grid-template-columns: 1fr;
    }
  }
</style>
