<script lang="ts">
  import { salaryLabel, EMPLOYMENT_LABELS, timeAgo, isValidEmail } from '$lib/utils';
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';
  import type { Employment } from '$lib/database.types';

  let { data }: PageProps = $props();

  const job = $derived(data.job);

  /* ——— Aplikacja o pracę (kandydat) ——— */
  let applied = $state(false);
  let applyOpen = $state(false);
  let sent = $state(false);
  let busy = $state(false);
  let aName = $state('');
  let aEmail = $state('');
  let aHeadline = $state('');
  let aExp = $state('');
  let aSkills = $state('');
  let aMsg = $state('');
  let loadedFor: string | null = null;

  $effect(() => {
    const uid = auth.user?.id;
    if (!uid || loadedFor === uid) return;
    loadedFor = uid;
    void prefill(uid);
  });

  async function prefill(uid: string) {
    if (auth.user?.email && !aEmail) aEmail = auth.user.email;
    const { data: existing } = await sb
      .from('job_applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('applicant_user_id', uid)
      .maybeSingle();
    if (existing) {
      applied = true;
      return;
    }
    const { data: cp } = await sb.from('candidate_profiles').select('*').eq('user_id', uid).maybeSingle();
    if (cp) {
      aName = cp.full_name ?? aName;
      aHeadline = cp.headline ?? '';
      aExp = cp.experience_years != null ? String(cp.experience_years) : '';
      aSkills = (cp.skills ?? []).join(', ');
    }
  }

  async function submitApply() {
    if (!auth.user) return;
    if (!aName.trim()) return toast('Podaj imię i nazwisko', 'error');
    if (!aEmail.trim() || !isValidEmail(aEmail)) return toast('Podaj poprawny adres e-mail', 'error');
    busy = true;
    const skills = aSkills.split(',').map((s) => s.trim()).filter(Boolean);
    const exp = parseInt(aExp, 10) || null;
    const { error } = await sb.from('job_applications').insert({
      job_id: job.id,
      applicant_user_id: auth.user.id,
      applicant_name: aName.trim(),
      applicant_email: aEmail.trim(),
      headline: aHeadline.trim() || null,
      experience_years: exp,
      skills,
      message: aMsg.trim() || null,
      stage: 'sent'
    });
    if (error) {
      busy = false;
      if (error.code === '23505') {
        applied = true;
        toast('Już aplikowałeś na to ogłoszenie', 'info');
      } else {
        toast('Błąd: ' + error.message, 'error');
      }
      return;
    }
    // zapisz CV na przyszłość
    await sb.from('candidate_profiles').upsert({
      user_id: auth.user.id,
      full_name: aName.trim(),
      headline: aHeadline.trim() || null,
      experience_years: exp,
      skills,
      updated_at: new Date().toISOString()
    });
    busy = false;
    sent = true;
    toast('Aplikacja wysłana ✓', 'success');
  }
  const isHiring = $derived(job.type === 'hiring');
  const typeColor = $derived(isHiring ? '#B5532E' : '#2B2724');
  const typeLabel = $derived(isHiring ? '💼 Zatrudnię' : '🙋 Szukam pracy');
  const salary = $derived(salaryLabel(job.salary_from, job.salary_to));
  const emp = $derived(job.employment ? (EMPLOYMENT_LABELS[job.employment] ?? '') : '');

  const metaTitle = $derived(`${job.title} — ${job.city} | Praca w Beauty`);
  const metaDesc = $derived(
    (job.description ?? `${typeLabel} ${job.title} w ${job.city}.`).slice(0, 160)
  );
  const canonical = $derived(`${data.origin}/jobs/${job.id}`);

  // Google for Jobs — JSON-LD JobPosting tylko dla ofert pracodawcy ("Zatrudnię").
  const EMP_TYPE: Record<Employment, string> = {
    uop: 'FULL_TIME',
    b2b: 'CONTRACTOR',
    zlecenie: 'PART_TIME',
    dowolna: 'OTHER'
  };

  const jsonLd = $derived.by(() => {
    if (!isHiring) return '';
    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org/',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description?.trim() || `${job.title} — oferta pracy w ${job.city}.`,
      datePosted: job.created_at,
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Pracodawca (dane kontaktowe w ogłoszeniu)',
        sameAs: data.origin
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.city,
          addressRegion: job.voivodeship ?? undefined,
          addressCountry: 'PL'
        }
      },
      identifier: { '@type': 'PropertyValue', name: 'BeautyKatalog', value: job.id },
      url: canonical,
      directApply: true
    };
    if (job.expires_at) ld.validThrough = job.expires_at;
    if (job.employment) ld.employmentType = EMP_TYPE[job.employment];
    if (job.salary_from) {
      ld.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: 'PLN',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salary_from,
          maxValue: job.salary_to ?? job.salary_from,
          unitText: 'MONTH'
        }
      };
    }
    // Escapowanie znaku „mniejsze niż" w treści, by nie rozbić bloku ze skryptem JSON-LD
    return JSON.stringify(ld).replace(/</g, '\\u003c');
  });
</script>

<svelte:head>
  <title>{metaTitle} — BeautyKatalog</title>
  <meta name="description" content={metaDesc} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDesc} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={canonical} />
  {#if jsonLd}
    {@html `<scr` + `ipt type="application/ld+json">${jsonLd}</scr` + `ipt>`}
  {/if}
</svelte:head>

<main class="bk-container wrap">
  <p class="crumbs"><a href="/jobs">← Wszystkie ogłoszenia</a></p>

  <div class="bk-card card">
    <div class="head">
      <span class="type" style="background:{typeColor}">{typeLabel}</span>
      <span class="ago">dodano {timeAgo(job.created_at)}</span>
    </div>

    <h1>{job.title}</h1>
    <p class="loc">📍 {job.city}{job.voivodeship ? `, ${job.voivodeship}` : ''}</p>

    <div class="tags">
      {#if salary}<span class="bk-badge bk-badge-ok">💰 {salary}</span>{/if}
      {#if emp}<span class="bk-badge">{emp}</span>{/if}
    </div>

    {#if job.description}
      <div class="desc">{job.description}</div>
    {/if}

    <div class="contact">
      <h2>Kontakt</h2>
      <div class="contact-btns">
        {#if job.phone}
          <a href="tel:{job.phone}" class="bk-btn bk-btn-primary" style="background:{typeColor}">📞 {job.phone}</a>
        {/if}
        {#if job.email}
          <a href="mailto:{job.email}" class="bk-btn bk-btn-outline">✉️ {job.email}</a>
        {/if}
      </div>
      <p class="hint">Kontaktując się, powołaj się na ogłoszenie z serwisu BeautyKatalog.</p>
    </div>
  </div>

  {#if isHiring}
    <div class="bk-card apply">
      {#if applied || sent}
        <div class="apply-done">
          <span class="apply-check">✓</span>
          <h2>Aplikacja wysłana</h2>
          <p>Twoja aplikacja trafiła do pracodawcy. Status śledzisz w panelu klienta.</p>
          <a href="/klient" class="bk-btn bk-btn-primary">Moje aplikacje →</a>
        </div>
      {:else if !auth.user}
        <h2>Aplikuj przez VELORA</h2>
        <p class="apply-sub">Zaloguj się, aby wysłać aplikację jednym kliknięciem — Twoje CV zapisze się na koncie i śledzisz status rekrutacji.</p>
        <a href="/klient" class="bk-btn bk-btn-primary">Zaloguj się / załóż konto</a>
      {:else if !applyOpen}
        <h2>Aplikuj przez VELORA</h2>
        <p class="apply-sub">Wyślij aplikację z profilu — pracodawca zobaczy Twoje CV i skontaktuje się z Tobą.</p>
        <button class="bk-btn bk-btn-primary" onclick={() => (applyOpen = true)}>Aplikuj</button>
      {:else}
        <h2>Twoja aplikacja</h2>
        <div class="apply-grid">
          <div class="apply-field apply-full"><label class="bk-label" for="a-name">Imię i nazwisko *</label><input id="a-name" class="bk-input" bind:value={aName} placeholder="Anna Kowalska" /></div>
          <div class="apply-field"><label class="bk-label" for="a-email">E-mail *</label><input id="a-email" class="bk-input" type="email" bind:value={aEmail} placeholder="ty@email.pl" /></div>
          <div class="apply-field"><label class="bk-label" for="a-exp">Doświadczenie (lata)</label><input id="a-exp" class="bk-input" type="number" min="0" bind:value={aExp} placeholder="np. 3" /></div>
          <div class="apply-field apply-full"><label class="bk-label" for="a-head">Specjalizacja / stanowisko</label><input id="a-head" class="bk-input" bind:value={aHeadline} placeholder="np. Stylistka paznokci" /></div>
          <div class="apply-field apply-full"><label class="bk-label" for="a-skills">Umiejętności (oddziel przecinkami)</label><input id="a-skills" class="bk-input" bind:value={aSkills} placeholder="Manicure hybrydowy, Zdobienia, Pedicure" /></div>
          <div class="apply-field apply-full"><label class="bk-label" for="a-msg">Wiadomość do pracodawcy</label><textarea id="a-msg" class="bk-input" rows="4" style="resize:vertical" bind:value={aMsg} placeholder="Kilka słów o sobie i dostępności…"></textarea></div>
        </div>
        <p class="apply-note">Wysyłając aplikację, udostępniasz pracodawcy powyższe dane. Zapisujemy je też jako Twoje CV w koncie.</p>
        <div class="apply-actions">
          <button class="bk-btn bk-btn-primary" disabled={busy} onclick={submitApply}>{busy ? 'Wysyłanie…' : 'Wyślij aplikację'}</button>
          <button class="bk-btn bk-btn-outline" onclick={() => (applyOpen = false)}>Anuluj</button>
        </div>
      {/if}
    </div>
  {/if}
</main>

<Footer>© 2026 BeautyKatalog · <a href="/jobs">Praca w beauty</a></Footer>

<style>
  .wrap {
    max-width: 720px;
    padding-top: 2rem;
    padding-bottom: 3.5rem;
  }
  .crumbs {
    font-size: 0.82rem;
    margin-bottom: 1rem;
  }
  .crumbs a {
    color: var(--accent);
  }
  .card {
    padding: 1.75rem;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .type {
    font-size: 0.72rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #fff;
    padding: 0.25rem 0.7rem;
    border-radius: 9999px;
  }
  .ago {
    font-size: 0.78rem;
    color: var(--muted);
  }
  h1 {
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    margin-bottom: 0.35rem;
  }
  .loc {
    font-size: 0.92rem;
    color: var(--muted);
    margin-bottom: 1rem;
  }
  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }
  .desc {
    font-size: 0.95rem;
    line-height: 1.65;
    color: var(--ink-2, #3a3a3a);
    white-space: pre-line;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--line, var(--border));
  }
  .contact h2 {
    font-size: 1rem;
    margin-bottom: 0.85rem;
  }
  .contact-btns {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
  }
  .hint {
    font-size: 0.76rem;
    color: var(--muted);
    margin-top: 0.85rem;
  }

  /* APLIKACJA */
  .apply {
    padding: 1.75rem;
    margin-top: 1.25rem;
  }
  .apply h2 {
    font-size: 1.15rem;
    margin-bottom: 0.4rem;
  }
  .apply-sub {
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 1.1rem;
    max-width: 52ch;
  }
  .apply-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
    margin-bottom: 0.85rem;
  }
  .apply-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .apply-full {
    grid-column: 1 / -1;
  }
  .apply-note {
    font-size: 0.72rem;
    color: var(--muted);
    margin-bottom: 1.1rem;
  }
  .apply-actions {
    display: flex;
    gap: 0.7rem;
    flex-wrap: wrap;
  }
  .apply-done {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }
  .apply-check {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--ok-bg);
    color: var(--ok-fg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }
  .apply-done p {
    font-size: 0.9rem;
    color: var(--muted);
    max-width: 44ch;
  }
  @media (max-width: 560px) {
    .apply-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
