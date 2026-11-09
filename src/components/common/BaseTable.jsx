import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

/**
 * columns: [{ key, header, render?(row), width?, align? }]
 */
export default function BaseTable({
  columns, rows, rowKey = (r) => r.id, loading, empty, pagination, onRowClick,
}) {
  if (loading) return <LoadingSpinner />;
  if (!rows?.length) return empty || <EmptyState message="No records match the current filters." />;

  return (
    <>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width, textAlign: c.align || 'left' }}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="pager">
          <span>{pagination.rangeLabel}</span>
          <button className="btn btn-secondary btn-sm" onClick={pagination.prev} disabled={pagination.page === 1}>‹</button>
          <span>Page {pagination.page} of {pagination.pageCount}</span>
          <button className="btn btn-secondary btn-sm" onClick={pagination.next} disabled={pagination.page === pagination.pageCount}>›</button>
        </div>
      )}
    </>
  );
}
