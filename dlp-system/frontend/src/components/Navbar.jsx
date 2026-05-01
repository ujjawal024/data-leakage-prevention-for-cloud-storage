import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const RoleBadge = ({ role }) => {
  const colors = {
    admin:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    manager:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    employee: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[role] ?? ''}`}>
      {role}
    </span>
  )
}

export default function Navbar() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
    ? 'text-blue-400 bg-navy-700'
    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'

  return (
    <nav className="sticky top-0 z-50 bg-navy-800/95 backdrop-blur border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center
                            group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/40">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">DLP Shield</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            <Link to="/dashboard" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
            <Link to="/my-files" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/my-files')}`}>
              My Files
            </Link>
            {role === 'admin' && (
              <Link to="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin')}`}>
                Admin Panel
              </Link>
            )}
          </div>

          {/* Right side — user info + logout */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-slate-300 font-medium">{user.username}</span>
                <RoleBadge role={role} />
              </div>
            )}
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                         text-slate-400 hover:text-red-400 hover:bg-red-400/10
                         border border-slate-700 hover:border-red-400/30
                         transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  )
}
