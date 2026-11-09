import { useMemo } from 'react';
import { useDataStore } from '@/stores/dataStore';

export default function useNotifications() {
  const alerts = useDataStore((s) => s.alerts);
  const updateItem = useDataStore((s) => s.updateItem);

  const unread = useMemo(() => alerts.filter((a) => !a.read), [alerts]);
  const unacknowledged = useMemo(() => alerts.filter((a) => !a.acknowledged), [alerts]);

  return {
    alerts,
    unread,
    unreadCount: unread.length,
    activeCount: unacknowledged.length,
    markRead: (id) => updateItem('alerts', id, { read: true }),
    markAllRead: () => alerts.filter((a) => !a.read).forEach((a) => updateItem('alerts', a.id, { read: true })),
    acknowledge: (id) => updateItem('alerts', id, { acknowledged: true, read: true }),
  };
}
