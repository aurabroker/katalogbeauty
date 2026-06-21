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

/** Forma zatrudnienia → etykieta */
export const EMPLOYMENT_LABELS: Record<Employment, string> = {
  uop: 'Umowa o pracę',
  b2b: 'B2B',
  zlecenie: 'Zlecenie',
  dowolna: 'Dowolna'
};

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
