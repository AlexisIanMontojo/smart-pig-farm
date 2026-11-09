import { create } from 'zustand';

export const useAppStore = create((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  globalSearch: '',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
}));
