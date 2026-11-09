import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar, { NAV_ITEMS } from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import AppBreadcrumb from '@/components/layout/AppBreadcrumb';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore, can } from '@/features/auth/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

function Toasts() {
  const { toasts, dismiss } = useNotificationStore();
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, display: 'grid', gap: 8, zIndex: 200 }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => dismiss(t.id)} className={`notice ${t.tone === 'warn' ? 'warn' : ''}`}
             style={{ background: t.tone === 'ok' ? 'var(--ok-bg)' : undefined, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function AdminLayout() {
  const { sidebarCollapsed, mobileNavOpen, closeMobileNav } = useAppStore();
  const role = useAuthStore((s) => s.user?.role);
  const { pathname } = useLocation();
  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.to));

  return (
    <div className="shell">
      <AppSidebar allowed={(perm) => can(role, perm)} />
      {mobileNavOpen && (
        <div className="overlay" style={{ zIndex: 55 }} onClick={closeMobileNav} aria-hidden />
      )}
      <div className={`shell-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <AppHeader title={current?.label || 'Smart Pig Farm Management System'} />
        <main className="page">
          <AppBreadcrumb />
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  );
}
