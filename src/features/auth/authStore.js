import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const ROLES = {
  ADMIN: 'Administrator',
  MANAGER: 'Farm Manager',
  WORKER: 'Farm Worker',
};

/** Demo-only capability map. Real authorization MUST be enforced server-side. */
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.MANAGER]: [
    'dashboard', 'pigs', 'feeding', 'medication', 'environment', 'reproduction',
    'growth', 'screening', 'inventory', 'finance', 'reports', 'alerts', 'settings:view',
  ],
  [ROLES.WORKER]: [
    'dashboard', 'pigs:view', 'feeding:record', 'medication:record',
    'environment', 'growth:record', 'screening', 'alerts',
  ],
};

export function can(role, permission) {
  const list = PERMISSIONS[role] || [];
  if (list.includes('*')) return true;
  if (list.includes(permission)) return true;
  const base = permission.split(':')[0];
  return list.some((p) => p === base || p.startsWith(`${base}:`));
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => { sessionStorage.removeItem('spf.token'); set({ user: null, isAuthenticated: false }); },
    }),
    {
      name: 'spf.auth.v1',
      storage: createJSONStorage(() => ({
        getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
        setItem: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
        removeItem: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
      })),
    },
  ),
);
