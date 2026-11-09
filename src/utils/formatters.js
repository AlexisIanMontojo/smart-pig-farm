export const php = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 })
    .format(Number(n) || 0);

export const num = (n, digits = 0) =>
  new Intl.NumberFormat('en-PH', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    .format(Number(n) || 0);

export const kg = (n) => `${num(n, 1)} kg`;
export const pct = (n) => `${num(n, 0)}%`;
export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || '?';
export const titleCase = (s = '') => s.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());
