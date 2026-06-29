// Endpoint pobierający dane firmy z rejestrów publicznych na podstawie NIP/REGON.
//
// Kolejność źródeł:
//   1. GUS BIR 1.1 (API REGON) — jeśli ustawiono zmienną GUS_API_KEY.
//      SOAP 1.2 + WS-Addressing, namespace http://CIS/BIR/PUBL/2014/07.
//      Działa po NIP lub REGON; zwraca pełne dane adresowe + REGON + NIP.
//   2. Wykaz podatników VAT (Ministerstwo Finansów) — bezpłatny, bez klucza,
//      wyszukiwanie po NIP. Zwraca nazwę, REGON i adres.
//
// Zwraca znormalizowany JSON: { name, nip, regon, street, postal_code, city, voivodeship }.
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

interface Company {
  name: string;
  nip: string | null;
  regon: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  voivodeship: string | null;
}

const onlyDigits = (s: string) => s.replace(/\D/g, '');

// NIP: 10 cyfr + suma kontrolna
function isValidNip(nip: string): boolean {
  if (nip.length !== 10) return false;
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(nip[i]), 0);
  return sum % 11 === Number(nip[9]);
}

// REGON: 9 lub 14 cyfr
function isValidRegon(regon: string): boolean {
  return regon.length === 9 || regon.length === 14;
}

function titleCasePl(s: string | null): string | null {
  if (!s) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s\-./])([a-ząćęłńóśźż])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

export const GET: RequestHandler = async ({ url, fetch }) => {
  const nip = onlyDigits(url.searchParams.get('nip') ?? '');
  const regon = onlyDigits(url.searchParams.get('regon') ?? '');

  // Walidacja lokalna przed odpytaniem rejestru (oszczędza zapytania do GUS)
  const nipOk = nip.length > 0 && isValidNip(nip);
  const regonOk = regon.length > 0 && isValidRegon(regon);
  if (nip.length > 0 && !nipOk) throw error(400, 'Nieprawidłowy NIP (10 cyfr, błędna suma kontrolna).');
  if (regon.length > 0 && !regonOk) throw error(400, 'Nieprawidłowy REGON (wymagane 9 lub 14 cyfr).');
  if (!nipOk && !regonOk) throw error(400, 'Podaj poprawny NIP (10 cyfr) lub REGON (9/14 cyfr).');

  // 1) GUS BIR 1.1 — jeśli skonfigurowano klucz API REGON
  if (env.GUS_API_KEY) {
    try {
      const data = await fetchFromGus(fetch, env.GUS_API_KEY, nipOk ? nip : '', regonOk ? regon : '');
      if (data) return json(data);
    } catch (e) {
      console.error('[regon] GUS BIR error:', e);
    }
  }

  // 2) Fallback: Wykaz podatników VAT (MF) — tylko po NIP
  if (nipOk) {
    try {
      const data = await fetchFromMf(fetch, nip);
      if (data) return json(data);
    } catch (e) {
      console.error('[regon] MF whitelist error:', e);
    }
  }

  throw error(404, 'Nie znaleziono firmy o podanych danych.');
};

/* ── Wykaz podatników VAT (Ministerstwo Finansów) ─────────────────────── */
async function fetchFromMf(fetchFn: typeof fetch, nip: string): Promise<Company | null> {
  const date = new Date().toISOString().slice(0, 10);
  const res = await fetchFn(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`);
  if (!res.ok) return null;
  const body = (await res.json()) as {
    result?: { subject?: { name?: string; nip?: string; regon?: string; workingAddress?: string; residenceAddress?: string } };
  };
  const s = body?.result?.subject;
  if (!s) return null;
  const { street, postal_code, city } = parseAddress(s.workingAddress || s.residenceAddress || '');
  return {
    name: s.name ?? '',
    nip: s.nip ?? nip,
    regon: s.regon ?? null,
    street,
    postal_code,
    city,
    voivodeship: null
  };
}

// "UL. MARSZAŁKOWSKA 1 LOK. 2, 00-001 WARSZAWA" → { street, postal_code, city }
function parseAddress(addr: string): { street: string | null; postal_code: string | null; city: string | null } {
  if (!addr) return { street: null, postal_code: null, city: null };
  const parts = addr.split(',').map((p) => p.trim());
  const street = titleCasePl(parts[0] || null);
  const tail = parts.slice(1).join(', ');
  const pc = tail.match(/\d{2}-\d{3}/);
  const postal_code = pc ? pc[0] : null;
  const city = titleCasePl(tail.replace(/\d{2}-\d{3}/, '').replace(/^[,\s]+|[,\s]+$/g, '').trim() || null);
  return { street, postal_code, city };
}

/* ── GUS BIR 1.1 (API REGON) ──────────────────────────────────────────── */
const BIR_URL = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const BIR_ACTION = 'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl';
const BIR_NS =
  'xmlns:soap="http://www.w3.org/2003/05/soap-envelope" ' +
  'xmlns:ns="http://CIS/BIR/PUBL/2014/07" ' +
  'xmlns:dat="http://CIS/BIR/PUBL/2014/07/DataContract"';

/** Wysyła żądanie SOAP 1.2; `sid` przekazujemy w nagłówku HTTP po zalogowaniu. */
async function soap(fetchFn: typeof fetch, action: string, body: string, sid?: string): Promise<string> {
  const res = await fetchFn(BIR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      ...(sid ? { sid } : {})
    },
    body:
      `<soap:Envelope ${BIR_NS}>` +
      `<soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">` +
      `<wsa:To>${BIR_URL}</wsa:To>` +
      `<wsa:Action>${action}</wsa:Action>` +
      `</soap:Header>` +
      `<soap:Body>${body}</soap:Body>` +
      `</soap:Envelope>`
  });
  return res.text();
}

/** Pierwszy dopasowany tag z XML-a. */
function extract(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

async function fetchFromGus(
  fetchFn: typeof fetch,
  key: string,
  nip: string,
  regon: string
): Promise<Company | null> {
  // 1. Logowanie — uzyskanie identyfikatora sesji (sid)
  const loginXml = await soap(
    fetchFn,
    `${BIR_ACTION}/Zaloguj`,
    `<ns:Zaloguj><ns:pKluczUzytkownika>${key}</ns:pKluczUzytkownika></ns:Zaloguj>`
  );
  const sid = extract(loginXml, 'ZalogujResult');
  if (!sid) return null; // błędny klucz / brak sesji

  // 2. Wyszukiwanie po NIP lub REGON
  const param = nip ? `<dat:Nip>${nip}</dat:Nip>` : `<dat:Regon>${regon}</dat:Regon>`;
  const searchXml = await soap(
    fetchFn,
    `${BIR_ACTION}/DaneSzukajPodmioty`,
    `<ns:DaneSzukajPodmioty><ns:pParametryWyszukiwania>${param}</ns:pParametryWyszukiwania></ns:DaneSzukajPodmioty>`,
    sid
  );

  // 3. Wyloguj (best-effort)
  void soap(fetchFn, `${BIR_ACTION}/Wyloguj`, `<ns:Wyloguj><ns:pIdentyfikatorSesji>${sid}</ns:pIdentyfikatorSesji></ns:Wyloguj>`, sid).catch(
    () => {}
  );

  const raw = extract(searchXml, 'DaneSzukajPodmiotyResult');
  if (!raw) return null;

  // Wynik to zaescape'owany XML — odkoduj encje i parsuj wewnętrzne pola
  const decoded = raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

  const name = extract(decoded, 'Nazwa');
  if (!name) return null;

  const ulica = extract(decoded, 'Ulica');
  const nr = extract(decoded, 'NrNieruchomosci');
  const lok = extract(decoded, 'NrLokalu');
  const street = ([ulica, nr].filter(Boolean).join(' ') + (lok ? `/${lok}` : '')).trim() || null;

  return {
    name,
    nip: extract(decoded, 'Nip') ?? (nip || null),
    regon: extract(decoded, 'Regon') ?? (regon || null),
    street: titleCasePl(street),
    postal_code: extract(decoded, 'KodPocztowy'),
    city: titleCasePl(extract(decoded, 'Miejscowosc')),
    voivodeship: extract(decoded, 'Wojewodztwo')?.toLowerCase() ?? null
  };
}
