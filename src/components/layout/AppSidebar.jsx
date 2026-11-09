import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, PiggyBank, UtensilsCrossed, Syringe, Thermometer, HeartPulse,
  TrendingUp, ScanLine, Package, Wallet, FileBarChart, Bell, Users, Settings, Sprout,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import useNotifications from '@/hooks/useNotifications';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard' },
  { to: '/pigs', label: 'Pigs & Pens', icon: PiggyBank, perm: 'pigs' },
  { to: '/feeding', label: 'Feeding', icon: UtensilsCrossed, perm: 'feeding' },
  { to: '/medication', label: 'Medication', icon: Syringe, perm: 'medication' },
  { to: '/environment', label: 'Environment', icon: Thermometer, perm: 'environment' },
  { to: '/reproduction', label: 'Reproduction', icon: HeartPulse, perm: 'reproduction' },
  { to: '/growth-harvest', label: 'Growth & Harvest', icon: TrendingUp, perm: 'growth' },
  { to: '/ai-screening', label: 'AI Image Screening', icon: ScanLine, perm: 'screening' },
  { to: '/inventory', label: 'Inventory', icon: Package, perm: 'inventory' },
  { to: '/finance', label: 'Finance', icon: Wallet, perm: 'finance' },
  { to: '/reports', label: 'Reports', icon: FileBarChart, perm: 'reports' },
  { to: '/alerts', label: 'Alerts', icon: Bell, perm: 'alerts' },
  { to: '/users', label: 'Users', icon: Users, perm: 'users' },
  { to: '/settings', label: 'Settings', icon: Settings, perm: 'settings' },
];

export default function AppSidebar({ allowed }) {
  const { sidebarCollapsed, mobileNavOpen, closeMobileNav } = useAppStore();
  const { activeCount } = useNotifications();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileNavOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="mark"><Sprout size={19} /></div>
        <div className="txt">
          <h1>Smart Pig Farm<br />Management System</h1>
          <span>MONITOR • AUTOMATE • MANAGE</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.filter((i) => allowed(i.perm)).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMobileNav}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={label}
          >
            <Icon size={17} />
            <span>{label}</span>
            {to === '/alerts' && activeCount > 0 && (
              <span className="badge danger" style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 7px' }}>
                {activeCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        Erwin&apos;s Piggery · Prototype build
      </div>
    </aside>
  );
}
