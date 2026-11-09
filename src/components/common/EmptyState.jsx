import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing to show', message, action }) {
  return (
    <div className="empty">
      <Icon size={34} color="var(--gray-300)" />
      <h4>{title}</h4>
      {message && <p style={{ margin: '0 0 12px' }}>{message}</p>}
      {action}
    </div>
  );
}
