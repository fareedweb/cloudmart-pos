import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store'
import { logout } from '../../api/api'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⬛', exact: true, roles: ['admin','manager','cashier'] },
  { to: '/pos', label: 'POS Cashier', icon: '🛒', roles: ['admin','manager','cashier'] },
  { to: '/products', label: 'Products', icon: '📦', roles: ['admin','manager'] },
  { to: '/inventory', label: 'Inventory', icon: '📊', roles: ['admin','manager'] },
  { to: '/suppliers', label: 'Suppliers', icon: '🚚', roles: ['admin','manager'] },
  { to: '/customers', label: 'Customers', icon: '👤', roles: ['admin','manager','cashier'] },
  { to: '/returns', label: 'Returns', icon: '↩️', roles: ['admin','manager'] },
  { to: '/reports', label: 'Reports', icon: '📈', roles: ['admin','manager'] },
  { to: '/dayend', label: 'Day End', icon: '🔒', roles: ['admin','manager'] },
  { to: '/expenses', label: 'Expenses', icon: '💸', roles: ['admin','manager'] },
  { to: '/users', label: 'Users', icon: '👥', roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: '⚙️', roles: ['admin'] },
  { to: '/backup', label: 'Backup', icon: '🛡️', roles: ['admin'] },
]

export default function Layout() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logout() } catch {}
    clearAuth()
    navigate('/login')
    toast.success('Logged out')
  }

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">CM</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text-primary)' }}>CloudMart</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>POS System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {visibleNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role}</div>
          <button onClick={handleLogout} className="sidebar-signout">
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
