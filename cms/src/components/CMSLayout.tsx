import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function CMSLayout() {
  const { user, hasRole, logout } = useAuth();
  const location = useLocation();
  const isAdmin = hasRole(['admin']);

  const isEditor = hasRole(['admin', 'marketing']);

  const navItems = [
    { to: '/', label: 'Pages' },
    { to: '/templates', label: 'Templates' },
    ...(isEditor ? [{ to: '/navigation', label: 'Navigation' }, { to: '/ui-strings', label: 'UI Strings' }] : []),
    ...(isAdmin ? [{ to: '/users', label: 'Users' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-slate-900">
              e-con CMS
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-500">
              {user?.role}
            </span>
            <button
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              onClick={() => logout()}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <Outlet />
    </div>
  );
}
