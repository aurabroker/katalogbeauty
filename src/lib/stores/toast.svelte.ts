/* Globalny stan toastów (runes). Mutowanie tablicy zachowuje reaktywność. */
export type ToastType = 'info' | 'success' | 'error';

export interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
}

export const toasts = $state<ToastItem[]>([]);

let nextId = 0;

export function toast(msg: string, type: ToastType = 'info', ms = 3500): void {
  const id = ++nextId;
  toasts.push({ id, msg, type });
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) toasts.splice(i, 1);
  }, ms);
}
