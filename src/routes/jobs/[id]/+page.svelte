<script lang="ts">
  import { salaryLabel, EMPLOYMENT_LABELS, timeAgo } from '$lib/utils';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';
  import type { Employment } from '$lib/database.types';

  let { data }: PageProps = $props();

  const job = $derived(data.job);
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
</style>
