/** Helpers for <input type="datetime-local"> values. */
export const toInputDateTime = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromInputDateTime = (v) => (v ? new Date(v).toISOString() : new Date().toISOString());