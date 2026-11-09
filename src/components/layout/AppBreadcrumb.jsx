import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { titleCase } from '@/utils/formatters';

export default function AppBreadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Home size={13} /> Home
      </Link>
      {parts.map((p, i) => (
        <span key={p + i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ChevronRight size={13} />
          <span style={{ color: i === parts.length - 1 ? 'var(--gray-700)' : undefined }}>
            {titleCase(p.replace(/-/g, ' '))}
          </span>
        </span>
      ))}
    </nav>
  );
}
