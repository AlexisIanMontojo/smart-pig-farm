import { useMemo } from 'react';
import { Grid2x2 } from 'lucide-react';

import BaseTable from '@/components/common/BaseTable';
import StatusBadge from '@/components/common/StatusBadge';
import { useDataStore } from '@/stores/dataStore';

export default function Pens() {
  const { pens, pigs } = useDataStore();

  const rows = useMemo(
    () =>
      pens.map((pen) => {
        const occupants = pigs.filter(
          (pig) => pig.penId === pen.id && !pig.archived
        );

        const count = occupants.length;
        const capacity = Number(pen.capacity) || 0;

        return {
          ...pen,
          count,
          ids:
            occupants
              .slice(0, 4)
              .map((pig) => pig.id)
              .join(', ') +
            (count > 4 ? ` +${count - 4}` : ''),
          over: count > capacity,
        };
      }),
    [pens, pigs]
  );

  return (
    <div className="card">
      <div className="card-head">
        <Grid2x2 size={16} color="var(--green-700)" />

        <h3>Pens</h3>

        <div className="spacer" />

        <span className="badge muted">
          {rows.filter((row) => row.over).length} over capacity
        </span>
      </div>

      <BaseTable
        rows={rows}
        columns={[
          {
            key: 'id',
            header: 'Pen ID',
            width: 95,
          },
          {
            key: 'name',
            header: 'Pen name',
            width: 110,
          },
          {
            key: 'purpose',
            header: 'Purpose',
          },
          {
            key: 'capacity',
            header: 'Capacity',
            align: 'right',
            width: 90,
          },
          {
            key: 'occupancy',
            header: 'Occupancy',
            width: 160,
            render: (row) => (
              <div>
                <div
                  style={{
                    fontSize: 12.5,
                    marginBottom: 3,
                    color: row.over ? 'var(--danger)' : undefined,
                  }}
                >
                  {row.count} / {row.capacity}
                </div>

                <div
                  style={{
                    height: 5,
                    background: 'var(--gray-200)',
                    borderRadius: 99,
                  }}
                >
                  <div
                    style={{
                      width: `${
                        row.capacity > 0
                          ? Math.min(
                              100,
                              (row.count / row.capacity) * 100
                            )
                          : 0
                      }%`,
                      height: '100%',
                      borderRadius: 99,
                      background: row.over
                        ? 'var(--danger)'
                        : row.capacity > 0 &&
                            row.count / row.capacity > 0.85
                          ? 'var(--warn)'
                          : 'var(--green-600)',
                    }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'ids',
            header: 'Assigned pigs',
            render: (row) =>
              row.ids || (
                <span style={{ color: 'var(--gray-500)' }}>
                  Empty
                </span>
              ),
          },
          {
            key: 'sensorId',
            header: 'Sensor',
            width: 100,
            render: (row) =>
              row.sensorId || (
                <span style={{ color: 'var(--gray-500)' }}>
                  Not configured
                </span>
              ),
          },
          {
            key: 'status',
            header: 'Status',
            width: 150,
            render: (row) => <StatusBadge status={row.status} />,
          },
        ]}
      />
    </div>
  );
}