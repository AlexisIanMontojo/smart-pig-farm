export const required = (label) => (v) =>
  v === null || v === undefined || String(v).trim() === '' ? `${label} is required.` : '';

export const minLength = (label, n) => (v) =>
  String(v ?? '').trim().length < n ? `${label} must be at least ${n} characters.` : '';

export const isEmail = (label = 'Email') => (v) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : `${label} must be a valid email address.`;

export const isNumber = (label) => (v) =>
  v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? `${label} must be a number.` : '';

export const inRange = (label, min, max) => (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return `${label} must be a number.`;
  if (min !== null && n < min) return `${label} cannot be less than ${min}.`;
  if (max !== null && n > max) return `${label} cannot be greater than ${max}.`;
  return '';
};

export const notFuture = (label) => (v) =>
  v && new Date(v) > new Date() ? `${label} cannot be in the future.` : '';

/** rules: { fieldName: [fn, fn] } -> { errors, valid } */
export function validate(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, fns]) => {
    for (const fn of fns) {
      const msg = fn(values[field], values);
      if (msg) { errors[field] = msg; break; }
    }
  });
  return { errors, valid: Object.keys(errors).length === 0 };
}
