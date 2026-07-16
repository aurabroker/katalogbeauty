<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { slug, VOIVODESHIPS, priceLabel, hoursToText } from '$lib/utils';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import PanelShell from '$lib/components/PanelShell.svelte';
  import type { Database, SalonWithRelations, Service, GalleryAsset, Json } from '$lib/database.types';

  const MEDIA_BUCKET = 'salon-media';

  let currentSalon = $state<SalonWithRelations | null>(null);
  let services = $state<Service[]>([]);
  let photos = $state<GalleryAsset[]>([]);
  let loadingData = $state(false);
  let loadedFor: string | null = null; // user.id, dla którego już wczytano dane

  let activeTab = $state('pulpit');

  const navGroups = [
    {
      items: [
        { id: 'pulpit', label: 'Pulpit', icon: 'grid' },
        { id: 'salon', label: 'Profil firmy', icon: 'building' },
        { id: 'services', label: 'Usługi i cennik', icon: 'scissors' },
        { id: 'photos', label: 'Galeria', icon: 'image' }
      ]
    },
    {
      label: 'Rekrutacja',
      items: [{ id: 'jobs', label: 'Oferty pracy', icon: 'briefcase', href: '/jobs/panel' }]
    },
    {
      label: 'Konto',
      items: [{ id: 'abonament', label: 'Abonament', icon: 'crown' }]
    }
  ];

  const TITLES: Record<string, string> = {
    pulpit: 'Pulpit',
    salon: 'Profil firmy',
    services: 'Usługi i cennik',
    photos: 'Galeria',
    abonament: 'Abonament'
  };
  const panelTitle = $derived(TITLES[activeTab] ?? 'Panel salonu');

  // Kompletność profilu (widget Pulpitu)
  const completeness = $derived.by(() => {
    if (!currentSalon) return 0;
    const checks = [
      !!form.name?.trim(),
      !!form.city?.trim(),
      !!form.description?.trim(),
      !!(form.phone?.trim() || form.email_contact?.trim()),
      services.length > 0,
      photos.length > 0
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  const statusLabel = $derived(
    !currentSalon
      ? 'Brak profilu'
      : currentSalon.status === 'active'
        ? 'Aktywny'
        : currentSalon.status === 'suspended' || currentSalon.status === 'archived'
          ? 'Wstrzymany'
          : 'Szkic'
  );

  const plans = [
    { name: 'Free', price: '0 zł', per: '/mies.', featured: false, cta: 'Twój pakiet', feats: ['Profil w katalogu', 'Do 5 zabiegów', 'Podstawowe statystyki'] },
    { name: 'Pro', price: '99 zł', per: '/mies.', featured: true, cta: 'Wybierz Pro', feats: ['Wszystko z Free', 'Nielimitowane zabiegi i zdjęcia', 'Wyróżnienie w wynikach', 'Oferty pracy w niższej cenie'] },
    { name: 'Premium', price: '199 zł', per: '/mies.', featured: false, cta: 'Wybierz Premium', feats: ['Wszystko z Pro', 'Priorytet w wyszukiwarce', 'Kampanie i reklama', 'Opiekun konta'] }
  ];

  function choosePlan(name: string) {
    toast(`Pakiet ${name}: płatności abonamentowe będą dostępne wkrótce.`, 'info');
  }

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

  // pobieranie danych firmy z rejestru (GUS REGON / Wykaz podatników VAT)
  let fetchingGus = $state(false);
  async function fetchCompany() {
    const nip = form.nip.replace(/\D/g, '');
    const regon = form.regon.replace(/\D/g, '');
    if (nip.length !== 10 && regon.length < 9) {
      toast('Wpisz NIP (10 cyfr) lub REGON, aby pobrać dane', 'error');
      return;
    }
    fetchingGus = true;
    try {
      const params = new URLSearchParams();
      if (nip.length === 10) params.set('nip', nip);
      if (regon.length >= 9) params.set('regon', regon);
      const res = await fetch(`/api/regon?${params}`);
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast(e?.message || 'Nie znaleziono firmy', 'error');
        return;
      }
      const c = await res.json();
      if (c.name) form.name = c.name;
      if (c.street) form.street = c.street;
      if (c.postal_code) form.postal_code = c.postal_code;
      if (c.city) form.city = c.city;
      if (c.regon) form.regon = c.regon;
      if (c.nip) form.nip = c.nip;
      if (c.voivodeship && (VOIVODESHIPS as readonly string[]).includes(c.voivodeship)) {
        form.voivodeship = c.voivodeship;
      }
      toast('Dane firmy pobrane ✓', 'success');
    } catch {
      toast('Błąd połączenia z rejestrem firm', 'error');
    } finally {
      fetchingGus = false;
    }
  }

  function emptyForm() {
    return {
      name: '', tagline: '', description: '', status: 'active',
      city: '', street: '', postal_code: '', voivodeship: '',
      phone: '', email_contact: '', website: '',
      instagram_url: '', facebook_url: '', tiktok_url: '',
      nip: '', regon: '', hours: ''
    };
  }

  // mapuje status BEAUTY → wybór w formularzu (widoczny / ukryty / wstrzymany)
  function statusToForm(s: SalonWithRelations): string {
    if (s.status === 'active') return 'active';
    if (s.status === 'suspended' || s.status === 'archived') return 'paused';
    return 'draft';
  }

  function populateForm(s: SalonWithRelations) {
    form = {
      name: s.name ?? '', tagline: s.short_description ?? '', description: s.description ?? '',
      status: statusToForm(s), city: s.city ?? '', street: s.address_line ?? '',
      postal_code: s.postal_code ?? '', voivodeship: s.voivodeship ?? '',
      phone: s.phone ?? '', email_contact: s.email ?? '', website: s.website_url ?? '',
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
      .select('*,services(*),gallery_assets(*)')
      .eq('owner_user_id', uid)
      .eq('source', 'katalog')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    loadingData = false;
    if (error) {
      console.error(error);
      return;
    }
    const salon = data as unknown as SalonWithRelations | null;
    if (salon) {
      currentSalon = salon;
      services = salon.services ?? [];
      photos = salon.gallery_assets ?? [];
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

    // NIP: baza wymaga dokładnie 10 cyfr albo null
    const nipDigits = form.nip.replace(/\D/g, '');
    if (form.nip.trim() && nipDigits.length !== 10) {
      toast('NIP musi mieć 10 cyfr (albo zostaw puste)', 'error');
      return;
    }

    // status formularza → status BEAUTY + published_at
    const dbStatus = (form.status === 'active' ? 'active' : form.status === 'paused' ? 'suspended' : 'draft') as
      Database['public']['Tables']['salons']['Row']['status'];
    const published_at =
      dbStatus === 'active' ? currentSalon?.published_at ?? new Date().toISOString() : currentSalon?.published_at ?? null;

    const base = {
      name: form.name.trim(),
      short_description: form.tagline.trim() || null,
      description: form.description.trim() || null,
      city: form.city.trim() || null,
      address_line: form.street.trim() || null,
      postal_code: form.postal_code.trim() || null,
      voivodeship: form.voivodeship || null,
      phone: form.phone.trim() || null,
      email: form.email_contact.trim() || null,
      website_url: form.website.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      tiktok_url: form.tiktok_url.trim() || null,
      nip: nipDigits.length === 10 ? nipDigits : null,
      regon: form.regon.replace(/\D/g, '') || null,
      opening_hours,
      status: dbStatus,
      published_at
    };

    savingSalon = true;
    let error;
    if (currentSalon) {
      ({ error } = await sb.from('salons').update(base).eq('id', currentSalon.id));
      if (!error) currentSalon = { ...currentSalon, ...base };
    } else {
      const insertPayload = {
        ...base,
        owner_user_id: auth.user.id,
        source: 'katalog',
        slug: `${slug(form.name) || 'salon'}-${Math.random().toString(36).slice(2, 7)}`
      } satisfies Database['public']['Tables']['salons']['Insert'];
      const res = await sb.from('salons').insert(insertPayload).select('*,services(*),gallery_assets(*)').single();
      error = res.error;
      if (!error) currentSalon = res.data as unknown as SalonWithRelations;
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
      service_name: svc?.name ?? '',
      price_from: svc?.price_from != null ? String(svc.price_from) : '',
      price_to: svc?.price_to != null ? String(svc.price_to) : '',
      duration_min: svc?.duration_min != null ? String(svc.duration_min) : '',
      is_available: String(svc?.is_active ?? true)
    };
    svcOpen = true;
  }

  async function saveService() {
    if (!currentSalon) return;
    if (!svcForm.service_name.trim()) {
      toast('Podaj nazwę zabiegu', 'error');
      return;
    }
    const name = svcForm.service_name.trim();
    const updatePayload = {
      name,
      price_from: parseFloat(svcForm.price_from) || null,
      price_to: parseFloat(svcForm.price_to) || null,
      duration_min: parseInt(svcForm.duration_min) || null,
      is_active: svcForm.is_available === 'true'
    };
    savingSvc = true;
    let error, data;
    if (svcEditingId) {
      ({ error, data } = await sb.from('services').update(updatePayload).eq('id', svcEditingId).select().single());
    } else {
      const insertPayload = {
        ...updatePayload,
        salon_id: currentSalon.id,
        slug: `${slug(name) || 'usluga'}-${Math.random().toString(36).slice(2, 7)}`
      } satisfies Database['public']['Tables']['services']['Insert'];
      ({ error, data } = await sb.from('services').insert(insertPayload).select().single());
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
    const { error } = await sb.from('services').delete().eq('id', id);
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
      const { error: upErr } = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { upsert: false });
      if (upErr) {
        toast('Błąd uploadu: ' + upErr.message, 'error');
        continue;
      }
      const { data: urlData } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      const { data: rec, error: dbErr } = await sb
        .from('gallery_assets')
        .insert({
          salon_id: currentSalon.id,
          asset_type: 'image',
          storage_provider: 'supabase',
          public_url: urlData.publicUrl,
          file_path: path,
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
    await sb.from('gallery_assets').update({ is_cover: false }).eq('salon_id', currentSalon.id);
    await sb.from('gallery_assets').update({ is_cover: true }).eq('id', id);
    photos = photos.map((p) => ({ ...p, is_cover: p.id === id }));
    toast('Okładka ustawiona ✓', 'success');
  }

  async function deletePhoto(id: string) {
    if (!confirm('Usunąć to zdjęcie?')) return;
    const photo = photos.find((p) => p.id === id);
    if (photo?.file_path) await sb.storage.from(MEDIA_BUCKET).remove([photo.file_path]);
    const { error } = await sb.from('gallery_assets').delete().eq('id', id);
    if (error) {
      toast('Błąd: ' + error.message, 'error');
      return;
    }
    photos = photos.filter((p) => p.id !== id);
    if (photo?.is_cover && photos.length) {
      await sb.from('gallery_assets').update({ is_cover: true }).eq('id', photos[0].id);
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
    title="Panel salonu"
    subtitle="Zaloguj się lub utwórz konto, aby zarządzać profilem salonu w VELORA."
    backHref="/"
    backLabel="← Strona główna VELORA"
  />
{:else}
  <PanelShell
    title={panelTitle}
    breadcrumb="Panel salonu"
    nav={navGroups}
    active={activeTab}
    accent="gold"
    userName={currentSalon?.name || 'Twój salon'}
    userMeta={auth.user.email}
    searchPlaceholder="Szukaj w panelu…"
    onselect={(id) => (activeTab = id)}
    onlogout={logout}
  >
    {#if loadingData}
      <Spinner />
    {:else if activeTab === 'pulpit'}
      <!-- PULPIT -->
      <div class="dash">
        <div class="dash-kpis">
          <div class="kpi">
            <span class="kpi-l">Status profilu</span>
            <span class="kpi-v">{statusLabel}</span>
            <span class="kpi-hint">{currentSalon ? 'Widoczność w katalogu' : 'Dodaj profil, aby zacząć'}</span>
          </div>
          <div class="kpi">
            <span class="kpi-l">Zabiegi w cenniku</span>
            <span class="kpi-v">{services.length}</span>
            <span class="kpi-hint">usług w ofercie</span>
          </div>
          <div class="kpi">
            <span class="kpi-l">Zdjęcia w galerii</span>
            <span class="kpi-v">{photos.length}</span>
            <span class="kpi-hint">zdjęć salonu</span>
          </div>
          <div class="kpi kpi-dark">
            <span class="kpi-l">Abonament</span>
            <span class="kpi-v">Free</span>
            <button type="button" class="kpi-link" onclick={() => (activeTab = 'abonament')}>Rozszerz pakiet →</button>
          </div>
        </div>

        <div class="dash-row">
          <div class="dash-card">
            <div class="dash-card-head">
              <h3>Kompletność profilu</h3>
              <span class="dash-pct">{completeness}%</span>
            </div>
            <div class="dash-bar"><span style="width:{completeness}%"></span></div>
            <p class="dash-note">Uzupełnij dane, cennik i zdjęcia, aby zwiększyć widoczność w katalogu.</p>
            <button type="button" class="bk-btn bk-btn-primary" style="align-self:flex-start" onclick={() => (activeTab = 'salon')}>Uzupełnij profil</button>
          </div>
          <div class="dash-card">
            <div class="dash-card-head"><h3>Szybkie akcje</h3></div>
            <div class="dash-actions">
              <button type="button" onclick={() => (activeTab = 'salon')}>Edytuj dane firmy</button>
              <button type="button" onclick={() => (activeTab = 'services')}>Dodaj zabieg do cennika</button>
              <button type="button" onclick={() => (activeTab = 'photos')}>Dodaj zdjęcia</button>
              {#if currentSalon}<a href="/salon/{currentSalon.id}" target="_blank" rel="noopener">Podgląd profilu publicznego ↗</a>{/if}
            </div>
          </div>
        </div>

        <div class="dash-card">
          <div class="dash-card-head"><h3>Dzisiejszy grafik</h3></div>
          <div class="dash-empty">Rezerwacje online pojawią się tutaj. Moduł kalendarza jest w przygotowaniu.</div>
        </div>
      </div>
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
        <div style="margin-top:.75rem">
          <button class="bk-btn bk-btn-outline" style="font-size:.82rem" disabled={fetchingGus} onclick={fetchCompany}>
            {fetchingGus ? '⏳ Pobieram dane…' : '🔍 Pobierz dane z rejestru REGON'}
          </button>
          <p style="font-size:.72rem;color:var(--muted);margin-top:.4rem">
            Wpisz NIP i pobierz nazwę oraz adres firmy z bazy GUS / Wykazu podatników VAT — pola uzupełnią się automatycznie.
          </p>
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
                  <p style="font-weight:700;font-size:.95rem">{svc.name}</p>
                  {#if !svc.is_active}<span style="font-size:.7rem;color:#dc2626;font-weight:700">niedostępny</span>{/if}
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
                  <img src={p.public_url} alt="Zdjęcie salonu" loading="lazy" style="width:100%;height:150px;object-fit:cover" />
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
    {:else if activeTab === 'abonament'}
      <!-- ABONAMENT -->
      <div style="max-width:900px">
        <div class="section-head"><h2>Wybierz pakiet</h2></div>
        <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem">Zacznij za darmo, rozwijaj salon gdy rośnie. Ceny netto, rozliczenie miesięczne.</p>
        <div class="plans">
          {#each plans as p (p.name)}
            <div class="plan" class:featured={p.featured}>
              {#if p.featured}<span class="plan-ribbon">Najczęściej wybierany</span>{/if}
              <span class="plan-name">{p.name}</span>
              <div class="plan-price"><span class="plan-amt">{p.price}</span><span class="plan-per">{p.per}</span></div>
              <ul class="plan-feats">
                {#each p.feats as f}<li>{f}</li>{/each}
              </ul>
              <button type="button" class="plan-cta" class:ghost={p.name === 'Free'} disabled={p.name === 'Free'} onclick={() => choosePlan(p.name)}>{p.cta}</button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </PanelShell>

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

{/if}

{#snippet section(title: string)}
  <h3 class="sec">{title}</h3>
{/snippet}

<style>
  /* PULPIT */
  .dash {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .dash-kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .kpi {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .kpi-dark {
    background: var(--sidebar-bg);
  }
  .kpi-l {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 500;
  }
  .kpi-dark .kpi-l {
    color: var(--gold);
  }
  .kpi-v {
    font-family: var(--serif);
    font-size: 32px;
    line-height: 1;
    color: var(--ink);
  }
  .kpi-dark .kpi-v {
    color: var(--porcelain);
  }
  .kpi-hint {
    font-size: 12px;
    color: var(--ink-3);
  }
  .kpi-link {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--champagne);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }
  .dash-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .dash-card {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .dash-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dash-card-head h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
  }
  .dash-pct {
    font-family: var(--serif);
    font-size: 22px;
    color: var(--copper);
  }
  .dash-bar {
    height: 10px;
    border-radius: 999px;
    background: var(--linen);
    overflow: hidden;
  }
  .dash-bar span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--copper));
    border-radius: 999px;
    transition: width 0.3s;
  }
  .dash-note {
    font-size: 13px;
    color: var(--ink-2);
  }
  .dash-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .dash-actions button,
  .dash-actions a {
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
  .dash-actions button:hover,
  .dash-actions a:hover {
    border-color: var(--gold);
  }
  .dash-empty {
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    padding: 26px;
    text-align: center;
    font-size: 13.5px;
    color: var(--ink-3);
  }

  /* ABONAMENT */
  .plans {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .plan {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 26px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
  }
  .plan.featured {
    background: var(--sidebar-bg);
    border: 1px solid var(--gold);
    color: var(--porcelain);
  }
  .plan-ribbon {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gold);
    color: var(--ink);
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .plan-name {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--copper);
  }
  .plan.featured .plan-name {
    color: var(--champagne);
  }
  .plan-price {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  .plan-amt {
    font-family: var(--serif);
    font-size: 34px;
    color: inherit;
  }
  .plan-per {
    font-size: 13px;
    color: var(--ink-3);
  }
  .plan.featured .plan-per {
    color: #c9bcad;
  }
  .plan-feats {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin: 0;
    padding: 0;
    flex: 1;
  }
  .plan-feats li {
    font-size: 13.5px;
    color: var(--ink-2);
    padding-left: 22px;
    position: relative;
  }
  .plan.featured .plan-feats li {
    color: #d8ccbc;
  }
  .plan-feats li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--copper);
    font-weight: 700;
  }
  .plan.featured .plan-feats li::before {
    color: var(--gold);
  }
  .plan-cta {
    border: none;
    background: var(--ink);
    color: var(--porcelain);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    padding: 12px;
    border-radius: 999px;
    cursor: pointer;
    transition: 0.18s;
  }
  .plan-cta:hover:not(:disabled) {
    background: var(--copper);
  }
  .plan.featured .plan-cta {
    background: var(--gold);
    color: var(--ink);
  }
  .plan.featured .plan-cta:hover:not(:disabled) {
    background: var(--champagne);
  }
  .plan-cta.ghost {
    background: transparent;
    border: 1px solid var(--line-strong);
    color: var(--ink-2);
    cursor: default;
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
  @media (max-width: 900px) {
    .dash-kpis {
      grid-template-columns: 1fr 1fr;
    }
    .dash-row {
      grid-template-columns: 1fr;
    }
    .plans {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 560px) {
    .fg-2 {
      grid-template-columns: 1fr;
    }
    .dash-kpis {
      grid-template-columns: 1fr;
    }
  }
</style>
