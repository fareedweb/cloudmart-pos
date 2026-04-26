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
    <div className="page-shell">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
          <div className="brand-logo">CM</div>
          <h1 className="page-title">CloudMart POS</h1>
          <p className="page-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" className="form-field" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="form-field" />
          </div>
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2xl)' }}>CloudMart Supermart &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
