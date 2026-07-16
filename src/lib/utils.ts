/* ================================================================
   BeautyKatalog · współdzielone funkcje pomocnicze
   (escaping nie jest potrzebny — Svelte escapuje {wyrażenia} sam)
================================================================ */
import type { Json, Employment } from '$lib/database.types';

/** Slug z polskich znaków: "Studio Urody Ewa" → "studio-urody-ewa" */
export function slug(str: string): string {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Lista województw (pusty pierwszy = brak wyboru) */
export const VOIVODESHIPS = [
  '', 'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'łódzkie',
  'małopolskie', 'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie',
  'pomorskie', 'śląskie', 'świętokrzyskie', 'warmińsko-mazurskie',
  'wielkopolskie', 'zachodniopomorskie'
] as const;

/** Etykieta ceny zabiegu/usługi: "120 zł" lub "120–180 zł" */
export function priceLabel(from: number | null, to: number | null): string {
  if (!from) return '';
  return to && to !== from ? `${from}–${to} zł` : `${from} zł`;
}

/** Etykieta wynagrodzenia ogłoszenia: "od 4000 zł" lub "4000–7000 zł" */
export function salaryLabel(from: number | null, to: number | null): string {
  if (!from) return '';
  return to && to !== from ? `${from}–${to} zł` : `od ${from} zł`;
}

/** Walidacja adresu e-mail (proste sprawdzenie wystarczające dla formularzy) */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Walidacja telefonu (PL): po odrzuceniu spacji/myślników i prefiksu +48/0 oczekuje 9 cyfr */
export function isValidPhone(phone: string): boolean {
  const digits = phone
    .replace(/[\s\-().]/g, '')
    .replace(/^\+?48/, '')
    .replace(/^0/, '');
  return /^\d{9}$/.test(digits);
}

/** Forma zatrudnienia → etykieta */
export const EMPLOYMENT_LABELS: Record<Employment, string> = {
  uop: 'Umowa o pracę',
  b2b: 'B2B',
  zlecenie: 'Zlecenie',
  dowolna: 'Dowolna'
};

/** Format szkolenia → etykieta */
export const TRAINING_FORMATS: Record<string, string> = {
  stacjonarnie: 'Stacjonarnie',
  online: 'Online',
  online_praktyka: 'Online + praktyka'
};
export function formatLabel(f: string | null | undefined): string {
  return f ? (TRAINING_FORMATS[f] ?? f) : '';
}

/** Data szkolenia: "2026-09-12" → "12 wrz 2026" */
export function trainingDate(iso: string | null | undefined): string {
  if (!iso) return 'Termin wkrótce';
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Etykieta miejsc: "Zostało N miejsc" / "Brak miejsc" */
export function seatsLabel(total: number | null, taken: number): string {
  if (total == null) return 'Zapisy otwarte';
  const left = Math.max(0, total - taken);
  if (left === 0) return 'Brak miejsc';
  return `${plural(left, 'wolne miejsce', 'wolne miejsca', 'wolnych miejsc')}`;
}

/** Odmiana liczebnika: "1 salon", "3 salony", "8 salonów" */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `1 ${one}`;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

/** Względny czas: "5 min temu", "2 godz. temu", "3 dni temu", data */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} min temu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} godz. temu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dni temu`;
  return new Date(iso).toLocaleDateString('pl-PL');
}

/** Godziny otwarcia (jsonb / string) → czytelny tekst */
export function hoursToText(opening_hours: Json | null | undefined): string {
  if (!opening_hours) return '';
  if (typeof opening_hours === 'string') return opening_hours;
  if (typeof opening_hours === 'object' && !Array.isArray(opening_hours)) {
    const text = opening_hours.text;
    if (typeof text === 'string') return text;
  }
  return JSON.stringify(opening_hours, null, 2);
}

/** Lista unikalnych miast posortowana po polsku */
export function uniqueCities(items: { city: string | null }[]): string[] {
  return [...new Set(items.map((i) => i.city).filter((c): c is string => Boolean(c)))].sort((a, b) =>
    a.localeCompare(b, 'pl')
  );
}

/** Pięć znaków gwiazdek wg oceny (zaokrąglenie do pełnej): "★★★★☆" */
export function starString(rating: number): string {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

/** Poziom cenowy salonu wg średniej ceny zabiegów: 1–3 (zł / zł·zł / zł·zł·zł) */
export function priceTier(prices: (number | null)[]): number {
  const vals = prices.filter((p): p is number => typeof p === 'number' && p > 0);
  if (!vals.length) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return avg < 100 ? 1 : avg <= 250 ? 2 : 3;
}
