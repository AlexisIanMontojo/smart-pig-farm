/** Simulated transport so feature services share one shape with the future backend. */
export const delay = (ms = 420) => new Promise((r) => setTimeout(r, ms));

export async function mockRequest(payload, { ms = 420, failRate = 0 } = {}) {
  await delay(ms);
  if (failRate > 0 && Math.random() < failRate) {
    throw { status: 503, message: 'Simulated service timeout. Please retry.' };
  }
  return { data: payload, simulated: true, receivedAt: new Date().toISOString() };
}

export const newId = (prefix) =>
  `${prefix}-${Date.now().toString(36).slice(-5)}${Math.floor(Math.random() * 90 + 10)}`.toUpperCase();
