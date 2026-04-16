import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/api'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username || !password) return toast.error('Enter username and password')
    setLoading(true)
    try {
      const res = await login({ username, password })
      setAuth(res.data.user, res.data.access_token)
      toast.success(`Welcome, ${res.data.user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background-tertiary)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-3xl)', width: '360px', boxShadow: 'var(--shadow-lg)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 600, fontSize: '22px', margin: '0 auto var(--space-sm)' }}>CM</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-xs)' }}>CloudMart POS</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-sm)' }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" style={{ width: '100%', padding: 'var(--space-md)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', fontSize: '14px' }} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 'var(--space-sm)' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ width: '100%', padding: 'var(--space-md)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', fontSize: '14px' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: 'var(--space-md)', background: 'var(--color-primary)', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: 'var(--space-sm)', transition: 'background-color 0.2s ease' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2xl)' }}>CloudMart Supermart &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
