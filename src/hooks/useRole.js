import { useAuthStore, ROLES } from '@/features/auth/authStore';

/** Demo-only role helpers. Real authorization must be enforced server-side. */
export default function useRole() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  return {
    user,
    role,
    isAdmin: role === ROLES.ADMIN,
    canManage: role === ROLES.ADMIN || role === ROLES.MANAGER,
    actor: user?.name || 'Demo user',
  };
}