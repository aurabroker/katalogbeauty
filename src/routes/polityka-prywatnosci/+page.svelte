<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';

  const UPDATED = '29 czerwca 2026';
</script>

<svelte:head>
  <title>Polityka Prywatności (RODO) — BeautyKatalog</title>
  <meta
    name="description"
    content="Polityka Prywatności serwisu BeautyKatalog — zasady przetwarzania danych osobowych zgodnie z RODO."
  />
</svelte:head>

<main class="bk-container doc">
  <p class="eyebrow">BeautyKatalog</p>
  <h1>Polityka Prywatności</h1>
  <p class="updated">Zgodna z RODO · wersja z dnia {UPDATED}</p>

  <div class="note">
    Pola oznaczone <code>[…]</code> należy uzupełnić pełnymi danymi rejestrowymi
    Administratora (forma prawna, NIP, adres siedziby, adres e-mail) przed publikacją.
  </div>

  <section>
    <h2>§1. Administrator danych</h2>
    <ol>
      <li>Administratorem danych osobowych jest <strong>Aura Consulting</strong> [pełna forma prawna], z siedzibą w [adres], NIP: [NIP], adres e-mail: <strong>[adres e-mail kontaktowy]</strong> (dalej: „Administrator"), operator serwisu BeautyKatalog (dalej: „Serwis").</li>
      <li>We wszelkich sprawach dotyczących przetwarzania danych można kontaktować się z Administratorem pod powyższym adresem e-mail.</li>
    </ol>
  </section>

  <section>
    <h2>§2. Zakres przetwarzanych danych</h2>
    <ul>
      <li><strong>Dane konta:</strong> adres e-mail, zaszyfrowane hasło, data utworzenia konta.</li>
      <li><strong>Dane salonu:</strong> nazwa, opis, adres, dane firmowe (NIP, REGON), telefon, e-mail, strona WWW, profile społecznościowe, zdjęcia.</li>
      <li><strong>Dane ogłoszeń:</strong> treść ogłoszenia oraz <strong>obowiązkowe dane kontaktowe (telefon i e-mail)</strong>, które są publikowane i widoczne dla innych użytkowników.</li>
      <li><strong>Dane techniczne:</strong> adres IP, dane przeglądarki, pliki cookies, logi serwera.</li>
    </ul>
  </section>

  <section>
    <h2>§3. Cele i podstawy prawne przetwarzania</h2>
    <ol>
      <li><strong>Założenie i prowadzenie konta oraz świadczenie usług</strong> (publikacja salonu i ogłoszeń) — art. 6 ust. 1 lit. b RODO (wykonanie umowy).</li>
      <li><strong>Publikacja danych kontaktowych w ogłoszeniu</strong> — art. 6 ust. 1 lit. b oraz lit. a RODO (zgoda wyrażona przez zamieszczenie ogłoszenia).</li>
      <li><strong>Rozliczenia i obowiązki podatkowe</strong> (ogłoszenia płatne) — art. 6 ust. 1 lit. c RODO (obowiązek prawny).</li>
      <li><strong>Marketing własny / newsletter</strong> — art. 6 ust. 1 lit. a RODO (zgoda, dobrowolna, możliwa do cofnięcia).</li>
      <li><strong>Bezpieczeństwo, zapobieganie nadużyciom, dochodzenie roszczeń</strong> — art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes Administratora).</li>
    </ol>
  </section>

  <section>
    <h2>§4. Dobrowolność podania danych</h2>
    <ol>
      <li>Podanie danych jest dobrowolne, ale niezbędne do założenia konta i korzystania z usług. Brak podania uniemożliwia rejestrację lub publikację salonu/ogłoszenia.</li>
      <li>Podanie danych do celów marketingowych jest w pełni dobrowolne i nie warunkuje korzystania z Serwisu.</li>
    </ol>
  </section>

  <section>
    <h2>§5. Odbiorcy danych i podmioty przetwarzające</h2>
    <ol>
      <li>Dane mogą być powierzane zaufanym dostawcom działającym na zlecenie Administratora, w szczególności:
        <ul>
          <li><strong>Supabase</strong> — hosting bazy danych, uwierzytelnianie i przechowywanie plików,</li>
          <li><strong>Cloudflare</strong> — hosting aplikacji, CDN oraz zabezpieczenie antyspamowe (CAPTCHA Turnstile),</li>
          <li>dostawcy usług płatniczych — w zakresie obsługi płatności za ogłoszenia, [uzupełnić],</li>
          <li>dostawcy poczty e-mail oraz narzędzi analitycznych [jeśli stosowane].</li>
        </ul>
      </li>
      <li>Przy pobieraniu danych firmowych korzystamy z publicznych rejestrów (GUS REGON, Wykaz podatników VAT Ministerstwa Finansów) — są to niezależni administratorzy danych.</li>
      <li>W razie przekazywania danych poza Europejski Obszar Gospodarczy odbywa się to na podstawie odpowiednich zabezpieczeń (np. standardowych klauzul umownych).</li>
    </ol>
  </section>

  <section>
    <h2>§6. Okres przechowywania</h2>
    <ul>
      <li>Dane konta — przez czas posiadania konta, a po jego usunięciu do czasu przedawnienia roszczeń.</li>
      <li>Dane ogłoszeń i salonów — do czasu ich usunięcia przez użytkownika lub Administratora.</li>
      <li>Dane rozliczeniowe — przez okres wymagany przepisami podatkowymi (co do zasady 5 lat).</li>
      <li>Dane przetwarzane na podstawie zgody — do czasu jej cofnięcia.</li>
    </ul>
  </section>

  <section>
    <h2>§7. Prawa osób, których dane dotyczą</h2>
    <ol>
      <li>Przysługuje Ci prawo do: dostępu do danych, sprostowania, usunięcia („prawo do bycia zapomnianym"), ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu wobec przetwarzania.</li>
      <li>W zakresie danych przetwarzanych na podstawie zgody — prawo do jej cofnięcia w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania sprzed cofnięcia.</li>
      <li>Masz prawo wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).</li>
      <li>W celu realizacji praw skontaktuj się z Administratorem pod adresem e-mail wskazanym w §1.</li>
    </ol>
  </section>

  <section>
    <h2>§8. Pliki cookies</h2>
    <ol>
      <li>Serwis wykorzystuje pliki cookies oraz podobne technologie niezbędne do działania (m.in. utrzymanie sesji logowania) oraz zapewnienia bezpieczeństwa (CAPTCHA).</li>
      <li>Możesz zarządzać cookies w ustawieniach przeglądarki; wyłączenie cookies niezbędnych może uniemożliwić korzystanie z konta.</li>
    </ol>
  </section>

  <section>
    <h2>§9. Zautomatyzowane decyzje i profilowanie</h2>
    <ol>
      <li>Administrator nie podejmuje wobec użytkowników decyzji opierających się wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, wywołujących skutki prawne.</li>
    </ol>
  </section>

  <section>
    <h2>§10. Zmiany Polityki Prywatności</h2>
    <ol>
      <li>Administrator może aktualizować Politykę Prywatności. Aktualna wersja jest zawsze dostępna w Serwisie, a o istotnych zmianach użytkownicy będą informowani.</li>
      <li>Polityka obowiązuje od dnia {UPDATED}.</li>
    </ol>
  </section>

  <p class="back"><a href="/regulamin">← Regulamin</a> · <a href="/">Strona główna</a></p>
</main>

<Footer>© 2026 BeautyKatalog by Aura Consulting</Footer>

<style>
  .doc {
    max-width: 820px;
    padding-top: 2.5rem;
    padding-bottom: 3.5rem;
  }
  .eyebrow {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.5rem;
  }
  h1 {
    font-size: clamp(1.7rem, 4vw, 2.3rem);
    margin-bottom: 0.4rem;
  }
  .updated {
    font-size: 0.85rem;
    color: var(--ink-3, var(--muted));
    margin-bottom: 1.5rem;
  }
  .note {
    font-size: 0.82rem;
    background: var(--vl, #f4f1ee);
    border: 1px solid var(--line, var(--border));
    border-radius: 0.6rem;
    padding: 0.85rem 1rem;
    margin-bottom: 2rem;
    color: var(--ink-2, var(--muted));
  }
  .note code {
    background: rgba(0, 0, 0, 0.06);
    padding: 0 0.25rem;
    border-radius: 0.25rem;
  }
  section {
    margin-bottom: 1.75rem;
  }
  h2 {
    font-size: 1.1rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid var(--line, var(--border));
  }
  ol,
  ul {
    padding-left: 1.3rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  li {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--ink-2, #3a3a3a);
  }
  ol ul {
    margin-top: 0.45rem;
  }
  .back {
    margin-top: 2.5rem;
    font-size: 0.875rem;
  }
  .back a {
    color: var(--accent);
    font-weight: 600;
  }
</style>
