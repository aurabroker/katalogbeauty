<script lang="ts">
  import { sb } from '$lib/supabase';
  import { auth } from '$lib/stores/auth.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatLabel, trainingDate, seatsLabel, isValidEmail } from '$lib/utils';
  import Footer from '$lib/components/Footer.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const t = $derived(data.training);

  let step = $state<'detail' | 'checkout' | 'done'>('detail');
  const steps = [
    { id: 'detail', label: 'Szkolenie' },
    { id: 'checkout', label: 'Płatność' },
    { id: 'done', label: 'Gotowe' }
  ];
  const stepIndex = $derived(steps.findIndex((s) => s.id === step));

  // ceny (cena z bazy = brutto; rozbijamy VAT 23%)
  const gross = $derived(Number(t.price_pln) || 0);
  const net = $derived(Math.round(gross / 1.23));
  const vat = $derived(gross - net);

  // płatność
  let method = $state<'card' | 'blik' | 'p24'>('card');
  let payState = $state<'idle' | 'processing'>('idle');
  let buyerName = $state('');
  let buyerEmail = $state('');
  let cardNo = $state('');
  let cardExp = $state('');
  let cardCvc = $state('');
  let blik = $state('');

  $effect(() => {
    if (auth.user?.email && !buyerEmail) buyerEmail = auth.user.email;
  });

  function goCheckout() {
    step = 'checkout';
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function pay() {
    if (!buyerEmail.trim() || !isValidEmail(buyerEmail)) {
      toast('Podaj poprawny adres e-mail do faktury', 'error');
      return;
    }
    if (method === 'blik' && blik.replace(/\D/g, '').length !== 6) {
      toast('Kod BLIK ma 6 cyfr', 'error');
      return;
    }
    payState = 'processing';
    // Makieta płatności — realny operator (P24/Stripe) podłączany osobno.
    await new Promise((r) => setTimeout(r, 1400));

    if (auth.user) {
      const { error } = await sb.from('training_enrollments').insert({
        training_id: t.id,
        user_id: auth.user.id,
        buyer_name: buyerName.trim() || null,
        buyer_email: buyerEmail.trim(),
        payment_method: method,
        payment_status: 'paid',
        amount_pln: gross,
        status: 'enrolled'
      });
      if (error) toast('Zapis nie został zapisany w koncie: ' + error.message, 'error');
    }
    payState = 'idle';
    step = 'done';
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>{t.title} — szkolenie beauty · VELORA</title>
  <meta name="description" content={t.description ?? `${t.title} — szkolenie beauty z certyfikacją w VELORA.`} />
</svelte:head>

<section class="cx-wrap">
  <a href="/szkolenia" class="cx-back">← Wszystkie szkolenia</a>

  <div class="cx-stepper" aria-hidden="true">
    {#each steps as s, i}
      <div class="cx-step" class:on={i === stepIndex} class:done={i < stepIndex}>
        <span class="cx-num">{i < stepIndex ? '✓' : i + 1}</span>
        <span class="cx-slabel">{s.label}</span>
      </div>
      {#if i < steps.length - 1}<span class="cx-line" class:done={i < stepIndex}></span>{/if}
    {/each}
  </div>

  {#if step === 'detail'}
    <!-- ——— KROK 1: SZCZEGÓŁY ——— -->
    <div class="cx-detail">
      <div class="cx-main">
        <div class="cx-hero" style="background:{t.cover_url ? `center/cover url(${t.cover_url})` : 'linear-gradient(150deg,#EBDAC2,#C9A98A)'}">
          {#if t.category}<span class="cx-cat">{t.category}</span>{/if}
        </div>
        <h1 class="cx-title">{t.title}</h1>
        <div class="cx-meta">
          <span>🗓 {trainingDate(t.event_date)}</span>
          <span>📍 {t.city ?? 'online'}</span>
          <span>🎓 {formatLabel(t.format)}</span>
          {#if t.is_certified}<span>✓ Certyfikat</span>{/if}
        </div>
        {#if t.description}<p class="cx-desc">{t.description}</p>{/if}

        <h3 class="cx-h3">W cenie szkolenia</h3>
        <ul class="cx-incl">
          <li>Materiały szkoleniowe i dostęp online po kursie</li>
          <li>Praca pod okiem praktyka (część warsztatowa)</li>
          <li>Imienny certyfikat ukończenia</li>
          <li>Faktura VAT</li>
        </ul>
      </div>

      <aside class="cx-side">
        <div class="cx-buy">
          <span class="cx-price">{gross} zł</span>
          <span class="cx-price-net">brutto · {net} zł netto + VAT 23%</span>
          <div class="cx-seats">{seatsLabel(t.seats_total, t.seats_taken)}</div>
          <button type="button" class="cx-btn" onclick={goCheckout}>Zapisz się</button>
          <p class="cx-note">Zapłać kartą, BLIK-iem lub Przelewy24. Miejsce rezerwujemy po opłaceniu.</p>
        </div>
      </aside>
    </div>
  {:else if step === 'checkout'}
    <!-- ——— KROK 2: PŁATNOŚĆ (makieta) ——— -->
    <div class="cx-detail">
      <div class="cx-main">
        <h1 class="cx-title">Płatność</h1>

        <div class="cx-tabs" role="tablist">
          <button type="button" class="cx-tab" class:on={method === 'card'} onclick={() => (method = 'card')}>Karta</button>
          <button type="button" class="cx-tab" class:on={method === 'blik'} onclick={() => (method = 'blik')}>BLIK</button>
          <button type="button" class="cx-tab" class:on={method === 'p24'} onclick={() => (method = 'p24')}>Przelewy24</button>
        </div>

        <div class="cx-fields">
          <div class="cx-f cx-f-full">
            <label class="bk-label" for="b-email">E-mail (do faktury i dostępu) *</label>
            <input id="b-email" class="bk-input" type="email" bind:value={buyerEmail} placeholder="ty@email.pl" />
          </div>
          <div class="cx-f cx-f-full">
            <label class="bk-label" for="b-name">Imię i nazwisko / firma</label>
            <input id="b-name" class="bk-input" bind:value={buyerName} placeholder="Anna Kowalska" />
          </div>

          {#if method === 'card'}
            <div class="cx-f cx-f-full">
              <label class="bk-label" for="c-no">Numer karty</label>
              <input id="c-no" class="bk-input" inputmode="numeric" bind:value={cardNo} placeholder="1234 5678 9012 3456" />
            </div>
            <div class="cx-f">
              <label class="bk-label" for="c-exp">Ważność</label>
              <input id="c-exp" class="bk-input" bind:value={cardExp} placeholder="MM/RR" />
            </div>
            <div class="cx-f">
              <label class="bk-label" for="c-cvc">CVC</label>
              <input id="c-cvc" class="bk-input" inputmode="numeric" bind:value={cardCvc} placeholder="123" />
            </div>
          {:else if method === 'blik'}
            <div class="cx-f cx-f-full">
              <label class="bk-label" for="blik">Kod BLIK</label>
              <input id="blik" class="bk-input" inputmode="numeric" maxlength="6" bind:value={blik} placeholder="6 cyfr" />
            </div>
          {:else}
            <p class="cx-p24">Po kliknięciu „Zapłać" nastąpiłoby przekierowanie do Przelewy24 (wybór banku). W tej wersji płatność jest makietą.</p>
          {/if}
        </div>

        <p class="cx-secure">🔒 Połączenie szyfrowane. Faktura zostanie wysłana na podany e-mail. Płatność w tej wersji jest makietą — bez realnego obciążenia.</p>
      </div>

      <aside class="cx-side">
        <div class="cx-buy">
          <span class="cx-sum-title">{t.title}</span>
          <span class="cx-sum-meta">{formatLabel(t.format)} · {t.city ?? 'online'} · {trainingDate(t.event_date)}</span>
          <div class="cx-sum">
            <div class="cx-sum-row"><span>Cena netto</span><span>{net} zł</span></div>
            <div class="cx-sum-row"><span>VAT 23%</span><span>{vat} zł</span></div>
            <div class="cx-sum-row cx-sum-total"><span>Razem</span><span>{gross} zł</span></div>
          </div>
          <button type="button" class="cx-btn" disabled={payState === 'processing'} onclick={pay}>
            {payState === 'processing' ? 'Przetwarzanie…' : `Zapłać ${gross} zł`}
          </button>
          <button type="button" class="cx-btn-ghost" onclick={() => (step = 'detail')}>← Wróć do szkolenia</button>
        </div>
      </aside>
    </div>
  {:else}
    <!-- ——— KROK 3: POTWIERDZENIE ——— -->
    <div class="cx-done">
      <span class="cx-check" aria-hidden="true">✓</span>
      <h1 class="cx-title">Zapis potwierdzony</h1>
      <p class="cx-done-sub">Dziękujemy! Zapisaliśmy Cię na <strong>{t.title}</strong>. Potwierdzenie i faktura trafią na <strong>{buyerEmail}</strong>.</p>
      <div class="cx-done-grid">
        <div class="cx-done-card"><span class="cx-di">🎓</span><span>Dostęp do materiałów po zalogowaniu</span></div>
        <div class="cx-done-card"><span class="cx-di">🗓</span><span>Przypomnienie przed terminem: {trainingDate(t.event_date)}</span></div>
        <div class="cx-done-card"><span class="cx-di">📜</span><span>Certyfikat po ukończeniu kursu</span></div>
      </div>
      {#if auth.user}
        <p class="cx-done-note">Dodano do <strong>Moje szkolenia</strong> w Twoim koncie.</p>
        <div class="cx-done-cta">
          <a href="/klient" class="cx-btn">Przejdź do Moje szkolenia</a>
          <a href="/szkolenia" class="cx-btn-ghost">Przeglądaj inne szkolenia</a>
        </div>
      {:else}
        <p class="cx-done-note">Załóż konto lub zaloguj się, aby śledzić postępy i pobrać certyfikat.</p>
        <div class="cx-done-cta">
          <a href="/klient" class="cx-btn">Zaloguj się / załóż konto</a>
          <a href="/szkolenia" class="cx-btn-ghost">Przeglądaj inne szkolenia</a>
        </div>
      {/if}
    </div>
  {/if}
</section>

<Footer>© 2026 VELORA · szkolenia beauty</Footer>

<style>
  .cx-wrap {
    max-width: 1040px;
    margin: 0 auto;
    padding: clamp(24px, 4vw, 44px) clamp(20px, 4vw, 44px) 64px;
    width: 100%;
  }
  .cx-back {
    display: inline-block;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--copper);
    margin-bottom: 22px;
  }
  .cx-back:hover {
    color: var(--ink);
  }

  /* STEPPER */
  .cx-stepper {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 30px;
  }
  .cx-step {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .cx-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #efe6da;
    color: #8a7d71;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex: none;
  }
  .cx-step.on .cx-num {
    background: var(--gold);
    color: var(--ink);
    border: 1px solid var(--ink);
  }
  .cx-step.done .cx-num {
    background: var(--ink);
    color: var(--porcelain);
  }
  .cx-slabel {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--ink-3);
  }
  .cx-step.on .cx-slabel,
  .cx-step.done .cx-slabel {
    color: var(--ink);
  }
  .cx-line {
    flex: 1;
    height: 1px;
    background: var(--line-strong);
    min-width: 20px;
  }
  .cx-line.done {
    background: var(--ink);
  }

  /* DETAIL / CHECKOUT LAYOUT */
  .cx-detail {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 28px;
    align-items: start;
  }
  .cx-main {
    min-width: 0;
  }
  .cx-hero {
    aspect-ratio: 16 / 8;
    border-radius: 18px;
    position: relative;
    margin-bottom: 20px;
  }
  .cx-cat {
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(251, 247, 241, 0.92);
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--premium-fg);
    text-transform: uppercase;
  }
  .cx-title {
    font-family: var(--serif);
    font-weight: 500;
    font-size: clamp(26px, 3.4vw, 36px);
    line-height: 1.1;
    color: var(--ink);
    margin: 0 0 14px;
  }
  .cx-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    font-size: 13.5px;
    color: var(--graphite);
    margin-bottom: 18px;
  }
  .cx-desc {
    font-size: 15.5px;
    line-height: 1.65;
    color: var(--ink-2);
    margin: 0 0 24px;
  }
  .cx-h3 {
    font-size: 15px;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 12px;
  }
  .cx-incl {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cx-incl li {
    font-size: 14px;
    color: var(--ink-2);
    padding-left: 24px;
    position: relative;
  }
  .cx-incl li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--copper);
    font-weight: 700;
  }

  /* SIDE / BUY */
  .cx-side {
    position: sticky;
    top: 20px;
  }
  .cx-buy {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: var(--shadow-lift);
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cx-price {
    font-family: var(--serif);
    font-size: 34px;
    color: var(--ink);
    line-height: 1;
  }
  .cx-price-net {
    font-size: 12.5px;
    color: var(--ink-3);
  }
  .cx-seats {
    font-size: 13px;
    font-weight: 600;
    color: var(--copper);
    background: var(--blush);
    border-radius: 999px;
    padding: 6px 12px;
    width: fit-content;
  }
  .cx-btn {
    border: none;
    background: var(--ink);
    color: var(--porcelain);
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    padding: 14px;
    border-radius: 999px;
    cursor: pointer;
    text-align: center;
    transition: background 0.18s;
  }
  .cx-btn:hover:not(:disabled) {
    background: var(--copper);
  }
  .cx-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .cx-btn-ghost {
    border: 1px solid var(--line-strong);
    background: transparent;
    color: var(--ink-2);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    padding: 11px;
    border-radius: 999px;
    cursor: pointer;
    text-align: center;
  }
  .cx-btn-ghost:hover {
    border-color: var(--ink);
    color: var(--ink);
  }
  .cx-note {
    font-size: 12px;
    color: var(--ink-3);
    margin: 0;
  }

  /* CHECKOUT */
  .cx-tabs {
    display: flex;
    gap: 5px;
    padding: 5px;
    background: var(--linen);
    border-radius: 13px;
    margin-bottom: 18px;
  }
  .cx-tab {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--graphite);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    padding: 11px;
    border-radius: 9px;
    cursor: pointer;
  }
  .cx-tab.on {
    background: var(--ink);
    color: var(--porcelain);
  }
  .cx-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .cx-f {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .cx-f-full {
    grid-column: 1 / -1;
  }
  .cx-p24 {
    grid-column: 1 / -1;
    font-size: 13.5px;
    color: var(--ink-2);
    background: var(--porcelain);
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    padding: 16px;
    margin: 0;
  }
  .cx-secure {
    font-size: 12px;
    color: var(--ink-3);
    margin: 16px 0 0;
  }
  .cx-sum-title {
    font-weight: 700;
    font-size: 15px;
    color: var(--ink);
  }
  .cx-sum-meta {
    font-size: 12.5px;
    color: var(--ink-3);
  }
  .cx-sum {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .cx-sum-row {
    display: flex;
    justify-content: space-between;
    font-size: 13.5px;
    color: var(--ink-2);
  }
  .cx-sum-total {
    font-weight: 700;
    font-size: 16px;
    color: var(--ink);
  }

  /* DONE */
  .cx-done {
    max-width: 620px;
    margin: 0 auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .cx-check {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--ok-bg);
    color: var(--ok-fg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    font-weight: 700;
  }
  .cx-done-sub {
    font-size: 15.5px;
    line-height: 1.6;
    color: var(--ink-2);
    margin: 0;
  }
  .cx-done-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    margin: 12px 0;
  }
  .cx-done-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 18px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    font-size: 12.5px;
    color: var(--ink-2);
    line-height: 1.4;
  }
  .cx-di {
    font-size: 22px;
  }
  .cx-done-note {
    font-size: 14px;
    color: var(--ink-2);
    margin: 0;
  }
  .cx-done-cta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 4px;
  }
  .cx-done-cta .cx-btn,
  .cx-done-cta .cx-btn-ghost {
    padding: 12px 22px;
  }

  @media (max-width: 860px) {
    .cx-detail {
      grid-template-columns: 1fr;
    }
    .cx-side {
      position: static;
    }
    .cx-done-grid {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 560px) {
    .cx-fields {
      grid-template-columns: 1fr;
    }
    .cx-slabel {
      display: none;
    }
  }
</style>
