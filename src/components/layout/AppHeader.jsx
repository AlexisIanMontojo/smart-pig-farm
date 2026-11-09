import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, PanelLeftClose, PanelLeft, Search, Bell, LogOut, UserCog } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/features/auth/authStore';
import useNotifications from '@/hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import { initials } from '@/utils/formatters';

export default function AppHeader({ title }) {
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, toggleMobileNav, globalSearch, setGlobalSearch } = useAppStore();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotifications();
  const [openBell, setOpenBell] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpenBell(false); setOpenUser(false); }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <header className="header">
      <button className="icon-btn" onClick={toggleMobileNav} aria-label="Open navigation"
              style={{ display: 'none' }} data-mobile-only>
        <Menu size={17} />
      </button>
      <button className="icon-btn" onClick={toggleSidebar} aria-label="Collapse sidebar">
        {sidebarCollapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
      </button>

      <h2>{title}</h2>
      <div className="spacer" />

      <div className="search-box">
        <Search size={15} color="var(--gray-500)" />
        <input
          placeholder="Search pigs, pens, records…"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          aria-label="Global search"
        />
      </div>

      <div ref={wrapRef} style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <button className="icon-btn" onClick={() => { setOpenBell((v) => !v); setOpenUser(false); }} aria-label="Notifications">
          <Bell size={17} />
          {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
        </button>
        {openBell && <NotificationDropdown onClose={() => setOpenBell(false)} />}

        <div className="user-chip" onClick={() => { setOpenUser((v) => !v); setOpenBell(false); }}>
          <div className="avatar">{initials(user?.name)}</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 650 }}>{user?.name}</div>
            <small>{user?.role}</small>
          </div>
        </div>

        {openUser && (
          <div className="dropdown" style={{ width: 210, top: 50 }}>
            <button className="dd-item" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer' }}
                    onClick={() => { setOpenUser(false); navigate('/settings'); }}>
              <UserCog size={15} /> Profile &amp; settings
            </button>
            <button className="dd-item" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                    onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
