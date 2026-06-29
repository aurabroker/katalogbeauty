<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';

  const UPDATED = '29 czerwca 2026';
</script>

<svelte:head>
  <title>Regulamin serwisu — BeautyKatalog</title>
  <meta
    name="description"
    content="Regulamin korzystania z serwisu BeautyKatalog — katalog salonów beauty i ogłoszenia pracy w branży beauty."
  />
</svelte:head>

<main class="bk-container doc">
  <p class="eyebrow">BeautyKatalog</p>
  <h1>Regulamin serwisu</h1>
  <p class="updated">Wersja z dnia {UPDATED}</p>

  <div class="note">
    Pola oznaczone <code>[…]</code> należy uzupełnić pełnymi danymi rejestrowymi
    Operatora (forma prawna, NIP, REGON, adres siedziby, adres e-mail oraz domena
    serwisu) przed publikacją regulaminu.
  </div>

  <section>
    <h2>§1. Postanowienia ogólne</h2>
    <ol>
      <li>Niniejszy Regulamin określa zasady korzystania z serwisu internetowego <strong>BeautyKatalog</strong> dostępnego pod adresem <strong>[domena serwisu]</strong> (dalej: „Serwis").</li>
      <li>Operatorem Serwisu jest <strong>Aura Consulting</strong> [pełna forma prawna], z siedzibą w [adres], NIP: [NIP], REGON: [REGON], adres e-mail: <strong>[adres e-mail kontaktowy]</strong> (dalej: „Operator").</li>
      <li>Regulamin jest udostępniany nieodpłatnie w sposób umożliwiający jego pozyskanie, odtworzenie i utrwalenie. Korzystanie z Serwisu oznacza akceptację Regulaminu.</li>
      <li>Serwis przeznaczony jest dla osób, które ukończyły 18 lat i posiadają pełną zdolność do czynności prawnych.</li>
    </ol>
  </section>

  <section>
    <h2>§2. Definicje</h2>
    <ul>
      <li><strong>Użytkownik</strong> — osoba fizyczna, osoba prawna lub jednostka organizacyjna korzystająca z Serwisu.</li>
      <li><strong>Konto</strong> — zbiór zasobów i ustawień przypisanych Użytkownikowi po rejestracji.</li>
      <li><strong>Salon</strong> — prezentacja działalności (salonu, gabinetu, specjalisty beauty) publikowana w katalogu Serwisu.</li>
      <li><strong>Ogłoszenie</strong> — ogłoszenie pracy typu „Zatrudnię" (oferta pracodawcy) lub „Szukam pracy" (oferta osoby poszukującej zatrudnienia).</li>
      <li><strong>Administrator</strong> — osoba działająca w imieniu Operatora, zarządzająca treściami i moderująca Serwis.</li>
      <li><strong>Treści</strong> — wszelkie materiały (teksty, zdjęcia, dane) zamieszczane przez Użytkownika.</li>
    </ul>
  </section>

  <section>
    <h2>§3. Zakres i rodzaje usług</h2>
    <ol>
      <li>Serwis świadczy drogą elektroniczną usługi polegające na:
        <ul>
          <li>prowadzeniu katalogu salonów i specjalistów branży beauty wraz z mapą, cennikiem zabiegów i galerią,</li>
          <li>umożliwieniu publikacji i przeglądania Ogłoszeń pracy,</li>
          <li>prowadzeniu Konta Użytkownika i paneli zarządzania (panel właściciela salonu, panel ogłoszeń).</li>
        </ul>
      </li>
      <li>Przeglądanie Serwisu jest bezpłatne i nie wymaga rejestracji. Publikacja Salonu oraz Ogłoszeń wymaga założenia Konta.</li>
    </ol>
  </section>

  <section>
    <h2>§4. Konto Użytkownika</h2>
    <ol>
      <li>Rejestracja następuje przez podanie adresu e-mail i ustawienie hasła oraz potwierdzenie adresu e-mail. Serwis może stosować zabezpieczenie antyspamowe (CAPTCHA).</li>
      <li>Użytkownik zobowiązany jest podawać dane prawdziwe i aktualne oraz chronić dane logowania. Zakazane jest udostępnianie Konta osobom trzecim.</li>
      <li>Użytkownik może w każdej chwili usunąć Konto, kontaktując się z Operatorem. Usunięcie Konta powoduje usunięcie powiązanych Salonów i Ogłoszeń.</li>
    </ol>
  </section>

  <section>
    <h2>§5. Prezentacja salonu w katalogu</h2>
    <ol>
      <li>Właściciel Salonu odpowiada za poprawność i aktualność publikowanych danych, w tym danych firmowych (NIP, REGON), adresu, cennika oraz zdjęć.</li>
      <li>Serwis udostępnia funkcję pobrania danych firmy z rejestrów publicznych (GUS REGON / Wykaz podatników VAT) w celu ułatwienia uzupełnienia danych. Operator nie odpowiada za poprawność danych pochodzących z rejestrów zewnętrznych.</li>
      <li>Zamieszczając zdjęcia i opisy, Użytkownik oświadcza, że posiada do nich prawa i udziela Operatorowi niewyłącznej, nieodpłatnej licencji na ich prezentację w Serwisie.</li>
      <li>Salon publikowany jest po zatwierdzeniu/aktywacji. Operator może wstrzymać lub ukryć Salon naruszający Regulamin.</li>
    </ol>
  </section>

  <section>
    <h2>§6. Ogłoszenia o pracę</h2>
    <ol>
      <li>W Serwisie dostępne są dwa typy Ogłoszeń:
        <ul>
          <li><strong>„Zatrudnię"</strong> — ogłoszenie <strong>płatne</strong>; jest publikowane po dokonaniu opłaty i aktywacji przez Administratora, na czas określony (termin ważności ustalany przy aktywacji),</li>
          <li><strong>„Szukam pracy"</strong> — ogłoszenie <strong>bezpłatne</strong>; jest publikowane <strong>po akceptacji (moderacji) przez Administratora</strong> w celu zapobiegania treściom niepożądanym.</li>
        </ul>
      </li>
      <li>Każde Ogłoszenie musi zawierać <strong>dane kontaktowe: numer telefonu oraz adres e-mail</strong> — oba pola są obowiązkowe i podlegają walidacji formatu.</li>
      <li>Ogłoszenie zgłoszone do publikacji ma status szkicu/oczekującego do czasu jego aktywacji lub akceptacji przez Administratora. Operator nie gwarantuje publikacji Ogłoszenia naruszającego Regulamin.</li>
      <li>Zakazane jest zamieszczanie Ogłoszeń: niezgodnych z prawem, wprowadzających w błąd, o charakterze dyskryminacyjnym, zawierających dane osób trzecich bez podstawy prawnej, treści reklamowych niezwiązanych z pracą w branży beauty, a także dublujących to samo Ogłoszenie.</li>
      <li>Po upływie terminu ważności Ogłoszenie przestaje być widoczne publicznie. Administrator może przedłużyć, ukryć lub usunąć Ogłoszenie.</li>
    </ol>
  </section>

  <section>
    <h2>§7. Płatności</h2>
    <ol>
      <li>Cena i okres publikacji Ogłoszenia płatnego („Zatrudnię") są prezentowane przy aktywacji Ogłoszenia. Ogłoszenia „Szukam pracy" są bezpłatne.</li>
      <li>Aktywacja Ogłoszenia płatnego następuje po potwierdzeniu opłaty. Na żądanie i po podaniu danych Operator może wystawić fakturę.</li>
      <li>Szczegółowe metody płatności oraz ewentualne pakiety i ceny określa cennik dostępny w Serwisie lub ustalany indywidualnie. [Uzupełnić sposób płatności.]</li>
    </ol>
  </section>

  <section>
    <h2>§8. Zasady korzystania i moderacja</h2>
    <ol>
      <li>Użytkownik zobowiązuje się do korzystania z Serwisu zgodnie z prawem i dobrymi obyczajami oraz do niezamieszczania treści bezprawnych.</li>
      <li>Administrator jest uprawniony do moderowania, edycji, ukrywania i usuwania Treści naruszających Regulamin lub przepisy prawa, a także do blokowania Kont.</li>
      <li>Każdy może zgłosić Treść naruszającą Regulamin na adres e-mail Operatora. Operator rozpatruje zgłoszenia bez zbędnej zwłoki.</li>
    </ol>
  </section>

  <section>
    <h2>§9. Odpowiedzialność Operatora</h2>
    <ol>
      <li>Operator udostępnia platformę umożliwiającą publikację Treści przez Użytkowników i nie jest stroną kontaktów ani umów zawieranych między Użytkownikami (np. pracodawcą a kandydatem).</li>
      <li>Operator nie ponosi odpowiedzialności za treść, rzetelność i aktualność Ogłoszeń i prezentacji Salonów zamieszczanych przez Użytkowników, w granicach dozwolonych prawem.</li>
      <li>Operator dokłada starań, aby Serwis działał nieprzerwanie, zastrzega jednak prawo do przerw technicznych i konserwacji.</li>
    </ol>
  </section>

  <section>
    <h2>§10. Dane osobowe (RODO)</h2>
    <ol>
      <li>Administratorem danych osobowych Użytkowników jest Operator. Dane przetwarzane są w celu świadczenia usług, obsługi Kont, publikacji Ogłoszeń oraz w celach kontaktowych i rozliczeniowych.</li>
      <li>Dane kontaktowe zamieszczone w Ogłoszeniu (telefon, e-mail) są publikowane i widoczne dla innych Użytkowników — ich podanie jest dobrowolne, lecz niezbędne do publikacji Ogłoszenia.</li>
      <li>Użytkownikowi przysługują prawa: dostępu, sprostowania, usunięcia, ograniczenia, przenoszenia danych oraz sprzeciwu, a także prawo wniesienia skargi do Prezesa UODO.</li>
      <li>Szczegółowe zasady przetwarzania danych określa <strong>Polityka Prywatności</strong> [link do uzupełnienia].</li>
    </ol>
  </section>

  <section>
    <h2>§11. Własność intelektualna</h2>
    <ol>
      <li>Serwis, jego nazwa, układ, grafika i oprogramowanie podlegają ochronie prawnej i stanowią własność Operatora lub podmiotów współpracujących.</li>
      <li>Zabronione jest kopiowanie, zwielokrotnianie i rozpowszechnianie zawartości Serwisu bez zgody Operatora, poza dozwolonym użytkiem.</li>
    </ol>
  </section>

  <section>
    <h2>§12. Reklamacje</h2>
    <ol>
      <li>Reklamacje dotyczące usług można składać na adres e-mail Operatora, podając dane Użytkownika i opis sprawy.</li>
      <li>Operator rozpatruje reklamacje w terminie 14 dni od ich otrzymania i informuje o wyniku drogą elektroniczną.</li>
    </ol>
  </section>

  <section>
    <h2>§13. Odstąpienie od umowy</h2>
    <ol>
      <li>Konsument oraz przedsiębiorca na prawach konsumenta może odstąpić od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny, składając stosowne oświadczenie.</li>
      <li>Prawo odstąpienia nie przysługuje w odniesieniu do usług w pełni wykonanych za wyraźną zgodą Użytkownika przed upływem terminu odstąpienia (np. opublikowane Ogłoszenie płatne), o czym Użytkownik jest informowany przed zakupem.</li>
    </ol>
  </section>

  <section>
    <h2>§14. Wymagania techniczne</h2>
    <ol>
      <li>Do korzystania z Serwisu niezbędne są: urządzenie z dostępem do Internetu, aktualna przeglądarka z obsługą JavaScript i plików cookies oraz aktywne konto e-mail (do rejestracji).</li>
    </ol>
  </section>

  <section>
    <h2>§15. Zmiany Regulaminu i postanowienia końcowe</h2>
    <ol>
      <li>Operator może zmienić Regulamin z ważnych przyczyn (zmiana przepisów, zakresu usług, względy techniczne lub bezpieczeństwa), informując Użytkowników z odpowiednim wyprzedzeniem.</li>
      <li>W sprawach nieuregulowanych stosuje się przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o świadczeniu usług drogą elektroniczną oraz przepisów o ochronie danych osobowych.</li>
      <li>Ewentualne spory strony będą starały się rozwiązać polubownie; konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w tym platformy ODR.</li>
      <li>Regulamin wchodzi w życie z dniem {UPDATED}.</li>
    </ol>
  </section>

  <p class="back"><a href="/">← Powrót do strony głównej</a></p>
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
