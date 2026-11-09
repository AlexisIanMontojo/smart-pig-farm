import { create } from 'zustand';

/** Transient in-app toasts. Separate from persisted alerts in dataStore. */
export const useNotificationStore = create((set, get) => ({
  toasts: [],
  push: (message, tone = 'ok', ttl = 3500) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    setTimeout(() => get().dismiss(id), ttl);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
