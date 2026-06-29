<script lang="ts">
  import { salaryLabel, EMPLOYMENT_LABELS, timeAgo } from '$lib/utils';
  import type { JobListing } from '$lib/database.types';

  const LOOKING_COLOR = '#2B2724'; // grafit — osoba szuka pracy
  const HIRING_COLOR = '#B5532E'; // terakota — salon zatrudni

  let { job }: { job: JobListing } = $props();

  const isHiring = $derived(job.type === 'hiring');
  const typeColor = $derived(isHiring ? HIRING_COLOR : LOOKING_COLOR);
  const typeLabel = $derived(isHiring ? '💼 Zatrudnię' : '🙋 Szukam pracy');
  const salary = $derived(salaryLabel(job.salary_from, job.salary_to));
  const emp = $derived(job.employment ? (EMPLOYMENT_LABELS[job.employment] ?? '') : '');
</script>

<div class="bk-card card">
  <div class="row">
    <span class="type" style="background:{typeColor}">{typeLabel}</span>
    <span class="ago">{timeAgo(job.created_at)}</span>
  </div>

  <div>
    <h2><a href="/jobs/{job.id}" class="title-link">{job.title}</a></h2>
    <p class="loc">📍 {job.city}{job.voivodeship ? `, ${job.voivodeship}` : ''}</p>
  </div>

  {#if job.description}
    <p class="desc">{job.description}</p>
  {/if}

  <div class="tags">
    {#if salary}<span class="bk-badge bk-badge-ok">💰 {salary}</span>{/if}
    {#if emp}<span class="bk-badge">{emp}</span>{/if}
  </div>

  <div class="contact">
    {#if job.phone}
      <a href="tel:{job.phone}" class="bk-btn bk-btn-primary" style="font-size:.8rem;padding:.35rem .85rem;background:{typeColor}">📞 {job.phone}</a>
    {/if}
    {#if job.email}
      <a href="mailto:{job.email}" class="bk-btn bk-btn-outline" style="font-size:.8rem;padding:.35rem .85rem">✉️ Email</a>
    {/if}
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    gap: 0.75rem;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .type {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #fff;
    padding: 0.22rem 0.65rem;
    border-radius: 9999px;
  }
  .ago {
    font-size: 0.72rem;
    color: var(--muted);
  }
  h2 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  .title-link {
    color: inherit;
  }
  .title-link:hover {
    color: var(--accent);
    text-decoration: underline;
  }
  .loc {
    font-size: 0.82rem;
    color: var(--muted);
  }
  .desc {
    font-size: 0.85rem;
    color: var(--ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .tags {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: auto;
  }
  .contact {
    border-top: 1px solid var(--border);
    padding-top: 0.75rem;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
</style>
