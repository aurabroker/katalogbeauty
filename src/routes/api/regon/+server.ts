// Endpoint pobierający dane firmy z rejestrów publicznych na podstawie NIP/REGON.
//
// Kolejność źródeł:
//   1. GUS BIR1 (API REGON) — jeśli ustawiono zmienną GUS_REGON_API_KEY.
//      Działa po NIP lub REGON, zwraca pełne dane adresowe + REGON + NIP.
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

function titleCasePl(s: string | null): string | null {
  if (!s) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s\-./])([a-ząćęłńóśźż])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

export const GET: RequestHandler = async ({ url, fetch }) => {
  const nip = onlyDigits(url.searchParams.get('nip') ?? '');
  const regon = onlyDigits(url.searchParams.get('regon') ?? '');

  if (nip.length !== 10 && regon.length < 9) {
    throw error(400, 'Podaj poprawny NIP (10 cyfr) lub REGON (9/14 cyfr).');
  }

  // 1) GUS BIR1 — jeśli skonfigurowano klucz API REGON
  if (env.GUS_REGON_API_KEY) {
    try {
      const data = await fetchFromGus(fetch, env.GUS_REGON_API_KEY, nip, regon);
      if (data) return json(data);
    } catch (e) {
      console.error('[regon] GUS BIR1 error:', e);
    }
  }

  // 2) Fallback: Wykaz podatników VAT (MF) — tylko po NIP
  if (nip.length === 10) {
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

/* ── GUS BIR1 (API REGON) ─────────────────────────────────────────────── */
const GUS_URL = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const GUS_NS = 'http://CIS/BIR/PublUDostepnienia/2019/01';
const GUS_DATA_NS = 'http://CIS/BIR/PublUDostepnienia/2019/01/DaneOsobowe';

async function gusSoap(fetchFn: typeof fetch, action: string, bodyXml: string, sid?: string): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/soap+xml; charset=utf-8' };
  if (sid) headers['sid'] = sid;
  const envelope =
    `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${GUS_NS}" xmlns:wsa="http://www.w3.org/2005/08/addressing">` +
    `<soap:Header><wsa:To>${GUS_URL}</wsa:To><wsa:Action>${action}</wsa:Action></soap:Header>` +
    `<soap:Body>${bodyXml}</soap:Body></soap:Envelope>`;
  const res = await fetchFn(GUS_URL, { method: 'POST', headers, body: envelope });
  return res.text();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function fetchFromGus(
  fetchFn: typeof fetch,
  key: string,
  nip: string,
  regon: string
): Promise<Company | null> {
  // 1. Zaloguj — uzyskaj identyfikator sesji (sid)
  const loginResp = await gusSoap(
    fetchFn,
    `${GUS_NS}/IUslugaBIRzewnPubl/Zaloguj`,
    `<ns:Zaloguj><ns:pKluczUzytkownika>${key}</ns:pKluczUzytkownika></ns:Zaloguj>`
  );
  const sid = loginResp.match(/<ZalogujResult>([^<]+)<\/ZalogujResult>/)?.[1]?.trim();
  if (!sid) return null;

  // 2. Wyszukaj podmiot po NIP lub REGON
  const param = nip.length === 10 ? `<dat:Nip>${nip}</dat:Nip>` : `<dat:Regon>${regon}</dat:Regon>`;
  const searchResp = await gusSoap(
    fetchFn,
    `${GUS_NS}/IUslugaBIRzewnPubl/DaneSzukajPodmioty`,
    `<ns:DaneSzukajPodmioty><ns:pParametryWyszukiwania xmlns:dat="${GUS_DATA_NS}">${param}</ns:pParametryWyszukiwania></ns:DaneSzukajPodmioty>`,
    sid
  );

  // Wyloguj (best-effort, nie blokuje wyniku)
  void gusSoap(fetchFn, `${GUS_NS}/IUslugaBIRzewnPubl/Wyloguj`, `<ns:Wyloguj><ns:pIdentyfikatorSesji>${sid}</ns:pIdentyfikatorSesji></ns:Wyloguj>`, sid).catch(
    () => {}
  );

  const raw = searchResp.match(/<DaneSzukajPodmiotyResult>([\s\S]*?)<\/DaneSzukajPodmiotyResult>/)?.[1];
  if (!raw) return null;
  const xml = decodeEntities(raw);
  const g = (tag: string) => xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() || null;

  const name = g('Nazwa');
  if (!name) return null;
  const ulica = g('Ulica');
  const nr = g('NrNieruchomosci');
  const lok = g('NrLokalu');
  const street = [ulica, nr].filter(Boolean).join(' ') + (lok ? `/${lok}` : '') || null;

  return {
    name,
    nip: g('Nip') ?? (nip.length === 10 ? nip : null),
    regon: g('Regon') ?? (regon || null),
    street: titleCasePl(street),
    postal_code: g('KodPocztowy'),
    city: titleCasePl(g('Miejscowosc')),
    voivodeship: g('Wojewodztwo')?.toLowerCase() ?? null
  };
}
