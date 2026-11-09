import { delay } from '@/services/mockApi';
import { isBackendConfigured } from '@/services/api';
import { ROLES } from './authStore';

/**
 * DEMO AUTHENTICATION ONLY.
 * Credentials are compared in the browser. This is not secure and must be
 * replaced by a server-side authentication endpoint before any real use.
 */
export const DEMO_ACCOUNTS = [
  { username: 'admin',   password: 'demo1234', name: 'Juan Dela Cruz', role: ROLES.ADMIN,   email: 'juan@erwinspiggery.ph' },
  { username: 'manager', password: 'demo1234', name: 'Maria Santos',   role: ROLES.MANAGER, email: 'maria@erwinspiggery.ph' },
  { username: 'worker',  password: 'demo1234', name: 'Ana Lopez',      role: ROLES.WORKER,  email: 'ana@erwinspiggery.ph' },
];

export const isRealAuthConfigured = () => isBackendConfigured();

export async function login({ username, password }) {
  await delay(650);
  const match = DEMO_ACCOUNTS.find(
    (a) => a.username.toLowerCase() === String(username).trim().toLowerCase() || a.email === String(username).trim().toLowerCase(),
  );
  if (!match || match.password !== password) {
    throw new Error('Incorrect username or password. Use one of the demo accounts listed below.');
  }
  return { user: { ...match, password: undefined }, demo: true };
}

export async function requestPasswordReset(email) {
  await delay(600);
  return {
    simulated: true,
    message: `No email provider is connected to this prototype, so no message was sent to ${email}. `
           + 'This screen only demonstrates the intended flow.',
  };
}
