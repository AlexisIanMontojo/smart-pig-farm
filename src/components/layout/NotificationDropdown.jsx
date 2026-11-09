import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import useNotifications from '@/hooks/useNotifications';
import { relativeTime } from '@/utils/dateUtils';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';

export default function NotificationDropdown({ onClose }) {
  const { alerts, unreadCount, markAllRead } = useNotifications();
  const recent = alerts.slice(0, 8);

  return (
    <div className="dropdown" onMouseLeave={onClose}>
      <div className="dd-item" style={{ background: 'var(--gray-050)', fontWeight: 650 }}>
        <span style={{ flex: 1 }}>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</span>
        <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
          <CheckCheck size={13} /> Mark all read
        </button>
      </div>

      {recent.length === 0 ? (
        <EmptyState title="No notifications" message="Simulated alerts will appear here." />
      ) : recent.map((a) => (
        <Link key={a.id} to={a.link} className={`dd-item ${a.read ? '' : 'unread'}`} onClick={onClose}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{a.title}</div>
            <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>{a.description}</div>
            <small>{a.category} · {relativeTime(a.at)}</small>
          </div>
          <StatusBadge status={a.severity} />
        </Link>
      ))}

      <div className="dd-item" style={{ justifyContent: 'center' }}>
        <Link to="/alerts" onClick={onClose} className="btn btn-ghost btn-sm">View all alerts</Link>
      </div>
    </div>
  );
}
