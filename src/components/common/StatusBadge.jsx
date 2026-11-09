const TONES = {
  Healthy: 'ok', Completed: 'ok', Active: 'ok', Ready: 'ok', 'In Stock': 'ok',
  Online: 'ok', 'Dispensing Confirmed': 'ok', 'Confirmed Pregnant': 'ok', Reviewed: 'ok',

  Scheduled: 'info', Pending: 'warn', 'Near Ready': 'info', 'Command Sent': 'info',
  Pregnant: 'info', Monitoring: 'info', Normal: 'ok',

  'Under Treatment': 'warn', 'Low Stock': 'warn', 'Needs Review': 'warn',
  'Insufficient Data': 'warn', 'Awaiting Confirmation': 'warn', 'Under Maintenance': 'warn',

  'Device Offline': 'danger', Failed: 'danger', Missed: 'danger', 'Out of Stock': 'danger',
  High: 'danger', Medium: 'warn', Low: 'info',

  Inactive: 'muted', Disabled: 'muted', Skipped: 'muted', 'Not Yet Ready': 'muted',
  Archived: 'muted', 'Not Applicable': 'muted', Open: 'muted',
};

export default function StatusBadge({ status, tone }) {
  if (!status) return <span className="badge muted">—</span>;
  return <span className={`badge ${tone || TONES[status] || 'muted'}`}>{status}</span>;
}
