import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/axios.js'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const handleLogin = async () => {
    if (!username || !password) { setError('Please enter username and password'); return }
    setError(null)
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      login(data.access_token, { username: data.username, user_id: data.user_id, role: data.role })
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 
                        bg-blue-600/10 rounded-full filter blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl
                          shadow-xl shadow-blue-600/40 mb-4">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text">DLP Shield</h1>
          <p className="text-slate-400 mt-1">Data Leakage Prevention Platform</p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-200 mb-6">Sign in to your account</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Enter your username"
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Enter your password"
                className="input-field"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              id="login-btn"
              onClick={handleLogin}
              disabled={loading}
              className="btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" id="go-register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Register here
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 card bg-navy-900/50 border-slate-700/30 text-xs text-slate-500 space-y-1">
          <p className="text-slate-400 font-medium text-sm mb-2">Demo credentials</p>
          <p>👤 admin / Admin@123</p>
          <p>👤 manager / Manager@123</p>
          <p>👤 employee / Emp@1234</p>
        </div>
      </div>
    </div>
  )
}
