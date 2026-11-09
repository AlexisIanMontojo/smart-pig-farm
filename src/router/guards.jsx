import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, can } from '@/features/auth/authStore';

/** Frontend route gating for demonstration only — not a security control. */
export function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RequirePermission({ permission, children }) {
  const role = useAuthStore((s) => s.user?.role);
  if (!can(role, permission)) {
    return (
      <div className="card">
        <div className="card-body">
          <h3>Not available for your demo role</h3>
          <p style={{ color: 'var(--gray-500)' }}>
            The <strong>{role}</strong> demo role does not include this module. Sign in as Administrator
            to see it. In production this restriction must also be enforced by the backend.
          </p>
        </div>
      </div>
    );
  }
  return children;
}
