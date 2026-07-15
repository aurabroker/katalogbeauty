<script lang="ts">
  import { goto } from '$app/navigation';
  import { plural, salaryLabel, EMPLOYMENT_LABELS } from '$lib/utils';
  import { toast } from '$lib/stores/toast.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  /* ————— Wyszukiwarka (3 zakładki) ————— */
  let tab = $state<'salon' | 'praca' | 'szkolenie'>('salon');
  let usluga = $state('');
  let lokalizacja = $state('');
  let termin = $state('');

  function submitSearch(e: SubmitEvent) {
    e.preventDefault();
    if (tab === 'salon') {
      const p = new URLSearchParams();
      if (usluga.trim()) p.set('q', usluga.trim());
      if (lokalizacja.trim()) p.set('gdzie', lokalizacja.trim());
      const qs = p.toString();
      goto('/szukaj' + (qs ? `?${qs}` : ''));
    } else if (tab === 'praca') {
      goto('/jobs');
    } else {
      document.getElementById('szkolenia')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* ————— Wyróżnione salony (dane realne + placeholdery) ————— */
  const salonTones = [
    'linear-gradient(160deg,#E7CFC6,#C29A88 55%,#8B6A59)',
    'linear-gradient(155deg,#EBDAC2,#C2A079)',
    'linear-gradient(150deg,#E7CFC6,#B98E7C)',
    'linear-gradient(160deg,#EAD9C4,#B79A86)',
    'linear-gradient(155deg,#E9CEC9,#BC8E86)',
    'linear-gradient(150deg,#E4D2AE,#C6A15B)'
  ];

  interface SalonVM {
    href: string;
    cover: string;
    tone: string;
    eyebrow: string;
    name: string;
    meta: string;
    count: number;
  }

  const salonCards = $derived.by<SalonVM[]>(() => {
    const real = data.salons ?? [];
    if (real.length) {
      return real.slice(0, 6).map((s, i) => {
        const gallery = (s.gallery_assets ?? []).filter((p) => p.is_active !== false);
        const cover = gallery.find((p) => p.is_cover)?.public_url ?? gallery[0]?.public_url ?? '';
        const count = (s.services ?? []).filter((sv) => sv.is_active !== false).length;
        return {
          href: `/salon/${s.id}`,
          cover,
          tone: salonTones[i % salonTones.length],
          eyebrow: count ? plural(count, 'zabieg', 'zabiegi', 'zabiegów') : 'Salon beauty',
          name: s.name,
          meta: [s.city, s.address_line].filter(Boolean).join(', '),
          count
        };
      });
    }
    return [
      { eyebrow: 'Fryzjer · Koloryzacja', name: 'Studio 01', meta: 'Warszawa, Śródmieście' },
      { eyebrow: 'Kosmetyka', name: 'Studio 02', meta: 'Kraków' },
      { eyebrow: 'Barber', name: 'Studio 03', meta: 'Wrocław' },
      { eyebrow: 'Paznokcie · Stylizacja', name: 'Studio 04', meta: 'Poznań' },
      { eyebrow: 'SPA · Masaż', name: 'Studio 05', meta: 'Gdańsk' },
      { eyebrow: 'Makijaż · Brwi', name: 'Studio 06', meta: 'Łódź' }
    ].map((p, i) => ({ href: '/szukaj', cover: '', tone: salonTones[i], count: 0, ...p }));
  });

  const hasSalons = $derived((data.salons ?? []).length > 0);

  /* ————— Popularne oferty pracy ————— */
  function initials(t: string): string {
    return t
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  interface JobVM {
    href: string;
    mono: string;
    role: string;
    hiring: boolean;
    badge: string;
    meta: string;
    salary: string;
    type: string;
  }

  const jobCards = $derived.by<JobVM[]>(() => {
    const real = data.featuredJobs ?? [];
    if (real.length) {
      return real.map((j) => ({
        href: `/jobs/${j.id}`,
        mono: initials(j.title),
        role: j.title,
        hiring: j.type === 'hiring',
        badge: j.type === 'hiring' ? 'ZATRUDNIĘ' : 'SZUKAM PRACY',
        meta: [j.city, j.employment ? EMPLOYMENT_LABELS[j.employment] : null]
          .filter(Boolean)
          .join(' · '),
        salary: salaryLabel(j.salary_from, j.salary_to) || 'Do uzgodnienia',
        type: j.type === 'hiring' ? 'Oferta pracy' : 'Ogłoszenie'
      }));
    }
    return [
      { mono: 'LS', role: 'Fryzjer / Fryzjerka', hiring: true, meta: 'Warszawa · Umowa o pracę', salary: '5 000–8 000 zł' },
      { mono: 'BM', role: 'Kosmetolog', hiring: true, meta: 'Kraków · B2B', salary: '6 000–9 000 zł' },
      { mono: 'AV', role: 'Barber', hiring: false, meta: 'Wrocław · Dowolna', salary: 'od 4 500 zł' },
      { mono: 'NS', role: 'Stylistka paznokci', hiring: true, meta: 'Poznań · Zlecenie', salary: '4 000–7 000 zł' },
      { mono: 'GL', role: 'Masażysta / Masażystka', hiring: false, meta: 'Gdańsk · Dowolna', salary: 'Do uzgodnienia' }
    ].map((p) => ({
      href: '/jobs',
      badge: p.hiring ? 'ZATRUDNIĘ' : 'SZUKAM PRACY',
      type: p.hiring ? 'Oferta pracy' : 'Ogłoszenie',
      ...p
    }));
  });

  const jobFilters = ['Wszystkie', 'Fryzjerstwo', 'Kosmetyka', 'Barber', 'SPA / masaż', 'Medycyna estetyczna'];

  /* ————— Polecane szkolenia (placeholder — filar w budowie) ————— */
  const trainingTones = [
    'linear-gradient(150deg,#EBDAC2,#C9A98A)',
    'linear-gradient(150deg,#E7CFC6,#B98E7C)',
    'linear-gradient(150deg,#E4D2AE,#C6A15B)',
    'linear-gradient(150deg,#E9D8C2,#BFA07C)'
  ];
  const trainings = [
    { cat: 'Kosmetologia', title: 'Mezoterapia igłowa — kurs podstawowy', format: 'Stacjonarnie', city: 'Warszawa', date: '12 wrz 2026', price: '1 290 zł', seats: 'Zostało 6 miejsc' },
    { cat: 'Fryzjerstwo', title: 'Koloryzacja i balayage — poziom II', format: 'Stacjonarnie', city: 'Kraków', date: '28 wrz 2026', price: '890 zł', seats: 'Zostały 4 miejsca' },
    { cat: 'Stylizacja rzęs', title: 'Metody objętościowe 3D–6D', format: 'Online + praktyka', city: 'Wrocław', date: '5 paź 2026', price: '690 zł', seats: 'Zostało 8 miejsc' },
    { cat: 'Makijaż', title: 'Makijaż ślubny i okolicznościowy', format: 'Stacjonarnie', city: 'Poznań', date: '19 paź 2026', price: '1 090 zł', seats: 'Zostało 5 miejsc' }
  ];

  function trainingSoon() {
    toast('Zapisy na szkolenia będą dostępne wkrótce.', 'info');
  }

  /* ————— Social proof (placeholder) ————— */
  const testimonials = [
    { quote: 'Dzięki VELORA obłożenie salonu wzrosło o jedną trzecią w kwartał. Rezerwacje układają się same.', name: 'Marta K.', role: 'Właścicielka salonu, Warszawa' },
    { quote: 'Nową pracę w innym mieście znalazłam w tydzień. Portfolio i opinie wędrują za mną, nie za salonem.', name: 'Karolina W.', role: 'Stylistka paznokci' },
    { quote: 'Szkolenia z certyfikacją i płatność w jednym miejscu — wreszcie ktoś zrobił to porządnie.', name: 'Ewa T.', role: 'Kosmetolog, Kraków' }
  ];
</script>

<svelte:head>
  <title>VELORA — Portal beauty: salony, praca i szkolenia</title>
  <meta
    name="description"
    content="VELORA łączy katalog salonów z rezerwacją, marketplace pracy dla branży beauty i szkolenia z certyfikacją — wszystko w jednym miejscu. Znajdź swój rytuał piękna."
  />
</svelte:head>

<!-- ============ HERO ============ -->
<section class="vel-hero">
  <div class="vel-wrap vel-hero-grid">
    <div class="vel-hero-copy">
      <span class="vel-eyebrow">Katalog · Praca · Szkolenia</span>
      <h1 class="vel-h1">Znajdź swój <em>rytuał</em> piękna.</h1>
      <p class="vel-lead">
        Rezerwuj wizyty w najlepszych salonach, znajdź pracę w branży beauty lub zapisz się na
        szkolenie — wszystko w jednym, spójnym miejscu.
      </p>

      <!-- WYSZUKIWARKA -->
      <form class="vel-search" onsubmit={submitSearch}>
        <div class="vel-tabs" role="tablist" aria-label="Czego szukasz">
          <button type="button" role="tab" aria-selected={tab === 'salon'} class="vel-tab-btn" class:on={tab === 'salon'} onclick={() => (tab = 'salon')}>Znajdź salon</button>
          <button type="button" role="tab" aria-selected={tab === 'praca'} class="vel-tab-btn" class:on={tab === 'praca'} onclick={() => (tab = 'praca')}>Znajdź pracę</button>
          <button type="button" role="tab" aria-selected={tab === 'szkolenie'} class="vel-tab-btn" class:on={tab === 'szkolenie'} onclick={() => (tab = 'szkolenie')}>Znajdź szkolenie</button>
        </div>
        <div class="vel-fields">
          <div class="vel-field vel-field-lg">
            <label for="f-usluga">Usługa / kategoria</label>
            <input id="f-usluga" bind:value={usluga} placeholder="Fryzjer, kosmetyka, SPA…" autocomplete="off" />
          </div>
          <span class="vel-div" aria-hidden="true"></span>
          <div class="vel-field">
            <label for="f-lok">Lokalizacja</label>
            <input id="f-lok" bind:value={lokalizacja} placeholder="Miasto" autocomplete="off" />
          </div>
          <span class="vel-div" aria-hidden="true"></span>
          <div class="vel-field vel-field-sm">
            <label for="f-termin">Termin</label>
            <input id="f-termin" type="date" bind:value={termin} />
          </div>
          <button type="submit" class="vel-search-btn">
            <span class="vel-search-ic" aria-hidden="true"></span>Szukaj
          </button>
        </div>
      </form>

      <div class="vel-stats">
        <div class="vel-stat"><span class="vel-stat-n">2 400+</span><span class="vel-stat-l">salonów</span></div>
        <div class="vel-stat"><span class="vel-stat-n">18 000+</span><span class="vel-stat-l">specjalistów</span></div>
        <div class="vel-stat"><span class="vel-stat-n">120+</span><span class="vel-stat-l">miast</span></div>
      </div>
    </div>

    <div class="vel-hero-media">
      <div class="vel-portrait" role="img" aria-label="Portret w salonie beauty">
        <span class="vel-portrait-cap">Piękno ma swój adres</span>
      </div>
      <div class="vel-float vel-float-a">
        <span class="vel-float-badge" aria-hidden="true"></span>
        <div><strong>Studio 01</strong><span>★ 4,9 · 214 opinii</span></div>
      </div>
      <div class="vel-float vel-float-b">
        <span class="vel-float-eyebrow">Najbliższy termin</span>
        <strong>Dziś · 14:00</strong>
      </div>
    </div>
  </div>
</section>

<!-- ============ WYRÓŻNIONE SALONY ============ -->
<section class="vel-sec">
  <div class="vel-wrap">
    <div class="vel-sec-head">
      <div>
        <span class="vel-eyebrow">Kuratorowany wybór</span>
        <h2 class="vel-h2">Wyróżnione salony</h2>
      </div>
      <a href="/szukaj" class="vel-seeall">Zobacz wszystkie →</a>
    </div>
    <div class="vel-salons">
      {#each salonCards as s (s.name)}
        <a href={s.href} class="vel-salon">
          <div class="vel-salon-img" style="background:{s.tone}">
            {#if s.cover}<img src={s.cover} alt={s.name} loading="lazy" />{/if}
            <span class="vel-salon-tag">{hasSalons ? 'Wyróżniony' : 'Placeholder'}</span>
            <span class="vel-heart" aria-hidden="true">♥</span>
          </div>
          <div class="vel-salon-body">
            <span class="vel-salon-cat">{s.eyebrow}</span>
            <span class="vel-salon-name">{s.name}</span>
            <span class="vel-salon-meta">{s.meta}</span>
            <div class="vel-salon-foot">
              {#if s.count}<span class="vel-salon-count">{plural(s.count, 'usługa', 'usługi', 'usług')}</span>{:else}<span class="vel-salon-count">Profil salonu</span>{/if}
              <span class="vel-pill-btn">Zobacz profil</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>

<!-- ============ BAND B2B ============ -->
<section class="vel-sec vel-sec-tight">
  <div class="vel-wrap">
    <div class="vel-b2b">
      <div class="vel-b2b-copy">
        <span class="vel-eyebrow gold">Dla salonów · B2B</span>
        <h2 class="vel-b2b-h">Rozwijaj salon<br />razem z VELORA</h2>
        <p>Rezerwacje online, rekrutacja specjalistów i widoczność premium w jednym panelu. Zacznij za darmo, skaluj gdy rośniesz.</p>
        <div class="vel-b2b-cta">
          <a href="/panel" class="vel-btn-gold">Dołącz jako salon</a>
          <a href="/panel" class="vel-btn-ghost">Zobacz cennik</a>
        </div>
      </div>
      <div class="vel-b2b-stats">
        <div class="vel-b2b-stat"><span class="n">+30%</span><span class="t">wyższe obłożenie dzięki rezerwacjom online</span></div>
        <div class="vel-b2b-stat"><span class="n">7 dni</span><span class="t">średni czas rekrutacji specjalisty</span></div>
        <div class="vel-b2b-stat"><span class="n">0 zł</span><span class="t">start w pakiecie Free, bez zobowiązań</span></div>
      </div>
    </div>
  </div>
</section>

<!-- ============ POPULARNE OFERTY PRACY ============ -->
<section class="vel-sec">
  <div class="vel-wrap">
    <div class="vel-sec-head">
      <div>
        <span class="vel-eyebrow">Marketplace pracy</span>
        <h2 class="vel-h2">Popularne oferty pracy</h2>
      </div>
      <a href="/jobs" class="vel-seeall">Wszystkie oferty →</a>
    </div>
    <div class="vel-jobfilters">
      {#each jobFilters as f, i}
        <a href="/jobs" class="vel-jobfilter" class:on={i === 0}>{f}</a>
      {/each}
    </div>
    <div class="vel-jobs">
      {#each jobCards as j (j.role)}
        <a href={j.href} class="vel-job">
          <span class="vel-job-mono" aria-hidden="true">{j.mono}</span>
          <div class="vel-job-main">
            <div class="vel-job-top">
              <span class="vel-job-role">{j.role}</span>
              <span class="vel-job-badge" class:hiring={j.hiring}>{j.badge}</span>
            </div>
            <span class="vel-job-meta">{j.meta}</span>
          </div>
          <div class="vel-job-pay">
            <span class="vel-job-salary">{j.salary}</span>
            <span class="vel-job-type">{j.type}</span>
          </div>
          <span class="vel-outline-btn">Aplikuj</span>
        </a>
      {/each}
    </div>
  </div>
</section>

<!-- ============ POLECANE SZKOLENIA ============ -->
<section class="vel-sec vel-sec-linen" id="szkolenia">
  <div class="vel-wrap">
    <div class="vel-sec-head">
      <div>
        <span class="vel-eyebrow">Rozwój i certyfikacja</span>
        <h2 class="vel-h2">Polecane szkolenia</h2>
      </div>
      <button type="button" class="vel-seeall" onclick={trainingSoon}>Wszystkie szkolenia →</button>
    </div>
    <div class="vel-trainings">
      {#each trainings as t, i (t.title)}
        <div class="vel-training">
          <div class="vel-training-img" style="background:{trainingTones[i % trainingTones.length]}">
            <span class="vel-training-cat">{t.cat}</span>
          </div>
          <div class="vel-training-body">
            <span class="vel-training-title">{t.title}</span>
            <span class="vel-training-meta">{t.format} · {t.city} · {t.date}</span>
            <div class="vel-training-foot">
              <div class="vel-training-price"><span class="p">{t.price}</span><span class="s">{t.seats}</span></div>
              <button type="button" class="vel-pill-btn" onclick={trainingSoon}>Zapisz się</button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ============ SOCIAL PROOF ============ -->
<section class="vel-sec">
  <div class="vel-wrap">
    <div class="vel-sec-head vel-sec-head-center">
      <span class="vel-eyebrow">Social proof</span>
      <h2 class="vel-h2">Zaufały nam salony i specjaliści</h2>
    </div>
    <div class="vel-quotes">
      {#each testimonials as q (q.name)}
        <figure class="vel-quote">
          <span class="vel-quote-mark" aria-hidden="true">”</span>
          <blockquote>{q.quote}</blockquote>
          <figcaption>
            <span class="vel-quote-av" aria-hidden="true"></span>
            <span><strong>{q.name}</strong><span>{q.role}</span></span>
          </figcaption>
        </figure>
      {/each}
    </div>
  </div>
</section>

<!-- ============ STOPKA ============ -->
<footer class="vel-footer">
  <div class="vel-wrap">
    <div class="vel-footer-grid">
      <div class="vel-footer-brand">
        <a href="/" class="vel-footer-word">
          <span class="vel-footer-mono" aria-hidden="true">V</span>
          <span class="vel-footer-name">VELORA</span>
        </a>
        <p>Portal beauty łączący katalog salonów, rynek pracy i szkolenia. Piękno ma swój adres.</p>
        <div class="vel-social">
          <span aria-hidden="true">ig</span><span aria-hidden="true">fb</span><span aria-hidden="true">tt</span>
        </div>
      </div>
      <div class="vel-footer-col">
        <span class="vel-footer-h">Portal</span>
        <a href="/">Katalog salonów</a>
        <a href="/jobs">Oferty pracy</a>
        <a href="/#szkolenia">Szkolenia</a>
        <span class="vel-footer-soon">Magazyn</span>
      </div>
      <div class="vel-footer-col">
        <span class="vel-footer-h">Dla salonów</span>
        <a href="/panel">Dołącz jako salon</a>
        <a href="/panel">Panel salonu</a>
        <a href="/jobs/panel">Dodaj ogłoszenie</a>
        <span class="vel-footer-soon">Cennik</span>
      </div>
      <div class="vel-footer-col">
        <span class="vel-footer-h">Firma</span>
        <a href="/regulamin">Regulamin</a>
        <a href="/polityka-prywatnosci">Prywatność (RODO)</a>
        <span class="vel-footer-soon">O nas</span>
        <span class="vel-footer-soon">Kontakt</span>
      </div>
    </div>
    <div class="vel-footer-legal">
      <span>© 2026 VELORA by Aura Consulting. Wszelkie prawa zastrzeżone.</span>
      <div>
        <a href="/regulamin">Regulamin</a>
        <a href="/polityka-prywatnosci">Polityka prywatności (RODO)</a>
        <a href="/polityka-prywatnosci">Pliki cookies</a>
      </div>
    </div>
  </div>
</footer>

<style>
  .vel-wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 clamp(20px, 4vw, 44px);
    width: 100%;
  }
  .vel-eyebrow {
    display: block;
    font-size: 12px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--copper);
    font-weight: 600;
  }
  .vel-eyebrow.gold {
    color: var(--gold);
  }
  .vel-h1 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(38px, 5.2vw, 60px);
    line-height: 1.03;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin: 0;
  }
  .vel-h1 em {
    font-style: italic;
    color: var(--copper);
  }
  .vel-h2 {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(27px, 3.4vw, 34px);
    line-height: 1.1;
    color: var(--ink);
    margin: 4px 0 0;
  }

  /* ————— HERO ————— */
  .vel-hero {
    background: linear-gradient(180deg, #fbf7f1, #f1e7da);
    padding: clamp(40px, 6vw, 60px) 0 clamp(44px, 6vw, 58px);
  }
  .vel-hero-grid {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: clamp(28px, 4vw, 46px);
    align-items: center;
  }
  .vel-hero-copy {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .vel-lead {
    margin: 0;
    max-width: 46ch;
    font-size: 17px;
    line-height: 1.6;
    color: var(--graphite);
  }

  /* SEARCH */
  .vel-search {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 20px;
    box-shadow: 0 24px 56px rgba(32, 27, 23, 0.12);
    padding: 10px;
    margin-top: 4px;
  }
  .vel-tabs {
    display: flex;
    gap: 4px;
    padding: 5px;
    background: var(--linen);
    border-radius: 13px;
    margin-bottom: 10px;
  }
  .vel-tab-btn {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--graphite);
    font-size: 14px;
    font-weight: 600;
    padding: 11px;
    border-radius: 9px;
    cursor: pointer;
    transition: 0.15s;
  }
  .vel-tab-btn:hover {
    background: rgba(255, 255, 255, 0.6);
  }
  .vel-tab-btn.on {
    background: var(--ink);
    color: var(--porcelain);
  }
  .vel-fields {
    display: flex;
    align-items: stretch;
    gap: 2px;
    padding: 2px 4px 4px;
  }
  .vel-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 14px;
    min-width: 0;
  }
  .vel-field-lg {
    flex: 1.4;
  }
  .vel-field-sm {
    flex: 0.9;
  }
  .vel-field label {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
    font-weight: 600;
  }
  .vel-field input {
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 15px;
    color: var(--ink);
    padding: 0;
    outline: none;
    width: 100%;
    min-width: 0;
  }
  .vel-field input::placeholder {
    color: var(--ink-3);
  }
  .vel-field input:focus {
    color: var(--ink);
  }
  .vel-div {
    width: 1px;
    background: var(--line);
    margin: 8px 0;
    flex: none;
  }
  .vel-search-btn {
    flex: none;
    border: none;
    background: var(--copper);
    color: var(--porcelain);
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    padding: 0 26px;
    border-radius: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 0.18s;
  }
  .vel-search-btn:hover {
    background: var(--ink);
  }
  .vel-search-ic {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-radius: 50%;
    display: inline-block;
    position: relative;
  }
  .vel-search-ic::after {
    content: '';
    position: absolute;
    right: -4px;
    bottom: -3px;
    width: 6px;
    height: 2px;
    background: currentColor;
    transform: rotate(45deg);
    border-radius: 2px;
  }

  .vel-stats {
    display: flex;
    gap: 26px;
    margin-top: 6px;
  }
  .vel-stat {
    display: flex;
    flex-direction: column;
  }
  .vel-stat-n {
    font-family: var(--serif);
    font-size: 26px;
    color: var(--ink);
    line-height: 1.1;
  }
  .vel-stat-l {
    font-size: 12.5px;
    color: var(--ink-3);
  }

  /* HERO MEDIA */
  .vel-hero-media {
    position: relative;
  }
  .vel-portrait {
    aspect-ratio: 5 / 6;
    border-radius: 24px;
    background: linear-gradient(160deg, #e7cfc6, #c29a88 55%, #8b6a59);
    box-shadow: 0 30px 70px rgba(32, 27, 23, 0.22);
    position: relative;
    overflow: hidden;
  }
  .vel-portrait-cap {
    position: absolute;
    top: 20px;
    left: 22px;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
  }
  .vel-float {
    position: absolute;
    background: var(--porcelain);
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(32, 27, 23, 0.18);
    padding: 14px 18px;
    animation: velFloat 5s ease-in-out infinite;
  }
  .vel-float-a {
    left: -22px;
    bottom: 64px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .vel-float-a strong {
    display: block;
    font-size: 14px;
    color: var(--ink);
  }
  .vel-float-a span {
    font-size: 12px;
    color: var(--copper);
  }
  .vel-float-badge {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: linear-gradient(145deg, #e4d2ae, #c6a15b);
    flex: none;
  }
  .vel-float-b {
    right: -16px;
    top: 48px;
    background: var(--ink);
    color: var(--porcelain);
    display: flex;
    flex-direction: column;
    gap: 2px;
    animation-delay: 1.2s;
  }
  .vel-float-eyebrow {
    font-size: 11px;
    color: var(--champagne);
    letter-spacing: 0.06em;
  }
  .vel-float-b strong {
    font-size: 15px;
  }

  /* ————— SECTIONS ————— */
  .vel-sec {
    padding: clamp(44px, 6vw, 64px) 0;
    background: var(--porcelain);
  }
  .vel-sec-tight {
    padding-top: 0;
  }
  .vel-sec-linen {
    background: linear-gradient(180deg, #fbf7f1, #f3ebe0);
    scroll-margin-top: 80px;
  }
  .vel-sec-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .vel-sec-head-center {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  .vel-seeall {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    border: 0;
    border-bottom: 1px solid var(--gold);
    padding: 0 0 2px;
    background: none;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .vel-seeall:hover {
    color: var(--copper);
  }

  /* Wspólny przycisk-pill (ciemny → miedź) */
  .vel-pill-btn {
    border: none;
    background: var(--ink);
    color: var(--porcelain);
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    padding: 9px 18px;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.18s;
    white-space: nowrap;
  }
  a:hover .vel-pill-btn,
  .vel-pill-btn:hover {
    background: var(--copper);
  }
  .vel-outline-btn {
    border: 1px solid var(--ink);
    background: transparent;
    color: var(--ink);
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 999px;
    flex: none;
    transition: 0.18s;
    white-space: nowrap;
  }
  a:hover .vel-outline-btn {
    background: var(--ink);
    color: var(--porcelain);
  }

  /* ————— SALONY ————— */
  .vel-salons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
  }
  .vel-salon {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: transform 0.25s, box-shadow 0.25s;
    display: flex;
    flex-direction: column;
    color: inherit;
  }
  .vel-salon:hover {
    transform: translateY(-5px);
    box-shadow: 0 26px 54px rgba(32, 27, 23, 0.14);
  }
  .vel-salon-img {
    aspect-ratio: 4 / 3;
    position: relative;
  }
  .vel-salon-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .vel-salon-tag {
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(251, 247, 241, 0.94);
    border-radius: 999px;
    padding: 5px 11px;
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
  }
  .vel-heart {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(251, 247, 241, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--copper);
    font-size: 15px;
  }
  .vel-salon-body {
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .vel-salon-cat {
    font-size: 11.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--copper);
    font-weight: 600;
  }
  .vel-salon-name {
    font-family: var(--serif);
    font-size: 22px;
    line-height: 1.15;
    color: var(--ink);
  }
  .vel-salon-meta {
    font-size: 13.5px;
    color: var(--ink-3);
  }
  .vel-salon-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .vel-salon-count {
    font-size: 13px;
    color: var(--graphite);
    font-weight: 600;
  }

  /* ————— B2B BAND ————— */
  .vel-b2b {
    background: var(--espresso);
    border-radius: 24px;
    padding: clamp(32px, 4vw, 52px);
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: clamp(28px, 4vw, 44px);
    align-items: center;
    color: #f3ebe0;
  }
  .vel-b2b-copy {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .vel-b2b-h {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(30px, 3.6vw, 38px);
    line-height: 1.1;
    color: var(--porcelain);
    margin: 0;
  }
  .vel-b2b-copy p {
    margin: 0;
    max-width: 44ch;
    font-size: 15.5px;
    line-height: 1.65;
    color: #c9bcad;
  }
  .vel-b2b-cta {
    display: flex;
    gap: 14px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .vel-btn-gold {
    background: var(--gold);
    color: var(--ink);
    font-weight: 700;
    font-size: 15px;
    padding: 14px 26px;
    border-radius: 999px;
    transition: background 0.18s;
  }
  .vel-btn-gold:hover {
    background: var(--champagne);
    color: var(--ink);
  }
  .vel-btn-ghost {
    border: 1px solid rgba(198, 161, 91, 0.5);
    color: #f3ebe0;
    font-weight: 600;
    font-size: 15px;
    padding: 13px 24px;
    border-radius: 999px;
    transition: border-color 0.18s;
  }
  .vel-btn-ghost:hover {
    border-color: var(--champagne);
    color: #f3ebe0;
  }
  .vel-b2b-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .vel-b2b-stat {
    background: rgba(251, 247, 241, 0.06);
    border: 1px solid rgba(198, 161, 91, 0.25);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .vel-b2b-stat .n {
    font-family: var(--serif);
    font-size: 26px;
    color: var(--champagne);
    flex: none;
  }
  .vel-b2b-stat .t {
    font-size: 14px;
    color: #c9bcad;
    line-height: 1.4;
  }

  /* ————— OFERTY PRACY ————— */
  .vel-jobfilters {
    display: flex;
    gap: 10px;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }
  .vel-jobfilter {
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--porcelain);
    border: 1px solid var(--line-strong);
    color: var(--graphite);
    font-size: 13.5px;
    transition: 0.15s;
  }
  .vel-jobfilter:hover {
    border-color: var(--ink);
    color: var(--ink);
  }
  .vel-jobfilter.on {
    background: var(--ink);
    color: var(--porcelain);
    border-color: var(--ink);
    font-weight: 600;
  }
  .vel-jobs {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .vel-job {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 20px;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: inherit;
  }
  .vel-job:hover {
    border-color: var(--gold);
    box-shadow: var(--shadow-lift);
  }
  .vel-job-mono {
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: linear-gradient(145deg, #f1e7da, #e0cfbc);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    font-family: var(--serif);
    font-size: 20px;
    color: var(--premium-fg);
  }
  .vel-job-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .vel-job-top {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .vel-job-role {
    font-weight: 700;
    font-size: 17px;
    color: var(--ink);
  }
  .vel-job-badge {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--neutral-bg);
    color: var(--neutral-fg);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .vel-job-badge.hiring {
    background: var(--premium-bg);
    color: var(--premium-fg);
  }
  .vel-job-meta {
    font-size: 14px;
    color: var(--ink-3);
  }
  .vel-job-pay {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    flex: none;
  }
  .vel-job-salary {
    font-weight: 700;
    font-size: 15px;
    color: var(--ink);
  }
  .vel-job-type {
    font-size: 12.5px;
    color: var(--ink-3);
  }

  /* ————— SZKOLENIA ————— */
  .vel-trainings {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
  .vel-training {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 18px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: transform 0.25s, box-shadow 0.25s;
    display: flex;
    flex-direction: column;
  }
  .vel-training:hover {
    transform: translateY(-5px);
    box-shadow: 0 24px 50px rgba(32, 27, 23, 0.13);
  }
  .vel-training-img {
    aspect-ratio: 16 / 10;
    position: relative;
  }
  .vel-training-cat {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(251, 247, 241, 0.92);
    border-radius: 999px;
    padding: 4px 11px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--premium-fg);
    text-transform: uppercase;
  }
  .vel-training-body {
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }
  .vel-training-title {
    font-family: var(--serif);
    font-size: 18px;
    line-height: 1.25;
    color: var(--ink);
  }
  .vel-training-meta {
    font-size: 13px;
    color: var(--ink-3);
  }
  .vel-training-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid var(--line);
    gap: 10px;
  }
  .vel-training-price {
    display: flex;
    flex-direction: column;
  }
  .vel-training-price .p {
    font-size: 16px;
    font-weight: 700;
    color: var(--ink);
  }
  .vel-training-price .s {
    font-size: 11.5px;
    color: var(--copper);
  }
  .vel-training-foot .vel-pill-btn {
    padding: 9px 16px;
    font-size: 13px;
  }

  /* ————— SOCIAL PROOF ————— */
  .vel-quotes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .vel-quote {
    background: var(--porcelain);
    border: 1px solid var(--line);
    border-radius: 20px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin: 0;
  }
  .vel-quote-mark {
    font-family: var(--serif);
    font-size: 40px;
    line-height: 0;
    color: var(--gold);
    height: 20px;
  }
  .vel-quote blockquote {
    margin: 0;
    font-family: var(--serif);
    font-size: 19px;
    line-height: 1.45;
    color: var(--espresso);
  }
  .vel-quote figcaption {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
  }
  .vel-quote-av {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(145deg, #e7cfc6, #c6a15b);
    flex: none;
  }
  .vel-quote figcaption strong {
    display: block;
    font-size: 14px;
    color: var(--ink);
  }
  .vel-quote figcaption span span {
    font-size: 12.5px;
    color: var(--ink-3);
  }

  /* ————— STOPKA ————— */
  .vel-footer {
    background: var(--ink);
    color: #c9bcad;
    padding: clamp(40px, 5vw, 56px) 0 30px;
    margin-top: auto;
  }
  .vel-footer-grid {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
    gap: 40px;
    padding-bottom: 36px;
    border-bottom: 1px solid rgba(198, 161, 91, 0.2);
  }
  .vel-footer-brand p {
    margin: 16px 0 0;
    max-width: 34ch;
    font-size: 14px;
    line-height: 1.6;
  }
  .vel-footer-word {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .vel-footer-mono {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-size: 18px;
    color: var(--champagne);
  }
  .vel-footer-name {
    font-family: var(--serif);
    font-size: 22px;
    letter-spacing: 0.16em;
    color: var(--porcelain);
  }
  .vel-social {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }
  .vel-social span {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(198, 161, 91, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--champagne);
    font-size: 13px;
  }
  .vel-footer-col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .vel-footer-h {
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 600;
  }
  .vel-footer-col a {
    font-size: 14px;
    color: #c9bcad;
    transition: color 0.15s;
  }
  .vel-footer-col a:hover {
    color: var(--porcelain);
  }
  .vel-footer-soon {
    font-size: 14px;
    color: #7d7266;
  }
  .vel-footer-legal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 22px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .vel-footer-legal > span {
    font-size: 13px;
    color: var(--ink-3);
  }
  .vel-footer-legal div {
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
  }
  .vel-footer-legal a {
    font-size: 13px;
    color: #c9bcad;
  }
  .vel-footer-legal a:hover {
    color: var(--porcelain);
  }

  /* ————— RESPONSYWNOŚĆ ————— */
  @media (max-width: 1023px) {
    .vel-hero-grid {
      grid-template-columns: 1fr;
    }
    .vel-hero-media {
      display: none;
    }
    .vel-salons {
      grid-template-columns: repeat(2, 1fr);
    }
    .vel-trainings {
      grid-template-columns: repeat(2, 1fr);
    }
    .vel-quotes {
      grid-template-columns: 1fr;
    }
    .vel-b2b {
      grid-template-columns: 1fr;
    }
    .vel-footer-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 767px) {
    .vel-fields {
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
    }
    .vel-field {
      background: var(--porcelain);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 9px 12px;
    }
    .vel-div {
      display: none;
    }
    .vel-search-btn {
      padding: 12px;
      justify-content: center;
    }
    .vel-salons {
      grid-template-columns: 1fr;
    }
    .vel-trainings {
      grid-template-columns: 1fr;
    }
    .vel-job {
      flex-wrap: wrap;
      gap: 12px 16px;
    }
    .vel-job-pay {
      align-items: flex-start;
    }
    .vel-outline-btn {
      width: 100%;
      text-align: center;
    }
    .vel-footer-grid {
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .vel-footer-legal {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
