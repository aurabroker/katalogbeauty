/* Globalny stan toastów (runes). Mutowanie tablicy zachowuje reaktywność. */
export const toasts = $state([]);

let nextId = 0;

/**
 * @param {string} msg
 * @param {'info'|'success'|'error'} [type]
 * @param {number} [ms]
 */
export function toast(msg, type = 'info', ms = 3500) {
  const id = ++nextId;
  toasts.push({ id, msg, type });
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i !== -1) toasts.splice(i, 1);
  }, ms);
}
