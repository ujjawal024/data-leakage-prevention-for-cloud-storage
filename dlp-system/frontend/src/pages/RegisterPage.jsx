import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.js'

export default function RegisterPage() {
  const [form,    setForm]    = useState({ username: '', email: '', password: '', role: 'employee' })
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) {
      setError('All fields are required')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96
                        bg-blue-600/10 rounded-full filter blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
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
          <p className="text-slate-400 mt-1">Create your account</p>
        </div>

        <div className="card shadow-2xl">
          {success ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="text-xl font-semibold text-emerald-400">Account Created!</h3>
              <p className="text-slate-400 mt-2">Redirecting to login…</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-200 mb-6">New account</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
                  <input id="reg-username" type="text" value={form.username}
                    onChange={update('username')} placeholder="Choose a username"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
                  <input id="reg-email" type="email" value={form.email}
                    onChange={update('email')} placeholder="your@email.com"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                  <input id="reg-password" type="password" value={form.password}
                    onChange={update('password')} placeholder="Create a password"
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Role</label>
                  <select id="reg-role" value={form.role} onChange={update('role')}
                    className="input-field">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                  <p className="text-xs text-slate-600 mt-1">Admin accounts must be created by an existing admin.</p>
                </div>

                {error && (
                  <div className="bg-red-950/50 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <button id="register-btn" onClick={handleRegister} disabled={loading}
                  className="btn-primary w-full py-3 mt-2">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" id="go-login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
