export const todayISO = () => new Date().toISOString().slice(0, 10);

export function parseDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
}

export function formatDateTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return `${formatDate(d)}, ${d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatTime(value) {
  if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m).padStart(2, '0')} ${suffix}`;
  }
  const d = parseDate(value);
  return d ? d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
}

export function addDays(value, days) {
  const d = parseDate(value);
  if (!d) return null;
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function daysBetween(from, to = new Date()) {
  const a = parseDate(from), b = parseDate(to);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}

export function ageFromBirthDate(birthDate) {
  const days = daysBetween(birthDate);
  if (days === null || days < 0) return { days: null, label: '—' };
  const months = Math.floor(days / 30.44);
  if (months < 1) return { days, label: `${days} day${days === 1 ? '' : 's'}` };
  return { days, label: `${months} month${months === 1 ? '' : 's'}` };
}

export function withinRange(value, from, to) {
  const d = parseDate(value);
  if (!d) return false;
  if (from && d < new Date(`${from}T00:00:00`)) return false;
  if (to && d > new Date(`${to}T23:59:59`)) return false;
  return true;
}

export function relativeTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}
