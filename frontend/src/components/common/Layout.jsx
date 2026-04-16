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
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background-tertiary)', fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', background: 'var(--color-background-primary)', borderRight: '1px solid var(--color-border-primary)', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
        {/* Logo */}
        <div style={{ padding: 'var(--space-xl) var(--space-lg) var(--space-lg)', borderBottom: '1px solid var(--color-border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 600, fontSize: '16px' }}>CM</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--color-text-primary)' }}>CloudMart</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>POS System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 'var(--space-sm)', overflowY: 'auto' }}>
          {visibleNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xs)', textDecoration: 'none',
                fontSize: '14px', fontWeight: isActive ? 600 : 500,
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
              })}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: 'var(--space-lg)', borderTop: '1px solid var(--color-border-primary)' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-sm)', textTransform: 'capitalize' }}>{user?.role}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: 'var(--space-sm)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'all 0.2s ease' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}
