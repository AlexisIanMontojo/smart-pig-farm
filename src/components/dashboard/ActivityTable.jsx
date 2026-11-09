import BaseTable from '@/components/common/BaseTable';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDateTime } from '@/utils/dateUtils';

export default function ActivityTable({ rows }) {
  return (
    <BaseTable
      rows={rows}
      columns={[
        { key: 'at', header: 'Date & time', render: (r) => formatDateTime(r.at), width: 170 },
        { key: 'type', header: 'Activity', width: 130 },
        { key: 'detail', header: 'Details' },
        { key: 'by', header: 'Recorded by', width: 150 },
        { key: 'status', header: 'Status', width: 120, render: (r) => <StatusBadge status={r.status} /> },
      ]}
    />
  );
}
