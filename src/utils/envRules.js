/** Compares one sensor reading against the farm-configured thresholds. */
export function readingState(r, t) {
  if (r.temperatureC > t.tempMax) return { label: 'Temperature High', tone: 'danger' };
  if (r.temperatureC < t.tempMin) return { label: 'Temperature Low', tone: 'warn' };
  if (r.humidityPct > t.humidityMax) return { label: 'Humidity High', tone: 'warn' };
  if (r.humidityPct < t.humidityMin) return { label: 'Humidity Low', tone: 'warn' };
  return { label: 'Normal', tone: 'ok' };
}