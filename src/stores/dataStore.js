import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildSeed } from '@/data/seed';
import { newId } from '@/services/mockApi';
import { getPigs, getPens } from '@/features/pigs/pigService';

const STORAGE_KEY = 'spf.data.v1';

const safeStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Ignore storage errors.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore storage errors.
    }
  },
};

const seed = buildSeed();
const COLLECTIONS = Object.keys(seed).filter((k) => Array.isArray(seed[k]));

export const useDataStore = create(
  persist(
    (set, get) => ({
      ...seed,

      // Replace a collection with backend records.
      setCollection: (collection, records) =>
        set({ [collection]: records }),

      // Load pigs and pens from MySQL through the backend API.
      loadPigsAndPens: async () => {
        try {
          const [pigs, pens] = await Promise.all([
            getPigs(),
            getPens(),
          ]);

          set({
            pigs,
            pens,
          });

          return { success: true };
        } catch (error) {
          console.error('Failed to load pigs and pens:', error);

          return {
            success: false,
            message: error.message || 'Failed to load database records.',
          };
        }
      },

      // Generic CRUD.
      addItem: (collection, item, prefix = 'ID') => {
        const record = { id: item.id || newId(prefix), ...item };

        set((state) => ({
          [collection]: [record, ...(state[collection] || [])],
        }));

        return record;
      },

      updateItem: (collection, id, patch) =>
        set((state) => ({
          [collection]: (state[collection] || []).map((record) =>
            record.id === id ? { ...record, ...patch } : record
          ),
        })),

      removeItem: (collection, id) =>
        set((state) => ({
          [collection]: (state[collection] || []).filter(
            (record) => record.id !== id
          ),
        })),

      getItem: (collection, id) =>
        (get()[collection] || []).find((record) => record.id === id),

      // Activity log.
      logActivity: (type, detail, status = 'Completed', by = 'Demo user') =>
        set((state) => ({
          activities: [
            {
              id: newId('AC'),
              at: new Date().toISOString(),
              type,
              detail,
              status,
              by,
            },
            ...(state.activities || []),
          ].slice(0, 200),
        })),

      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),

      resetDemoData: () => {
        safeStorage.removeItem(STORAGE_KEY);
        set({ ...buildSeed() });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),

      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') {
          return current;
        }

        const safe = {};

        COLLECTIONS.forEach((key) => {
          safe[key] = Array.isArray(persisted[key])
            ? persisted[key]
            : current[key];
        });

        safe.settings =
          persisted.settings && typeof persisted.settings === 'object'
            ? { ...current.settings, ...persisted.settings }
            : current.settings;

        return { ...current, ...safe };
      },

      partialize: (state) => {
        const output = { settings: state.settings };

        COLLECTIONS.forEach((key) => {
          output[key] = state[key];
        });

        return output;
      },
    }
  )
);