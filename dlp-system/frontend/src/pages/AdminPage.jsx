import { useState, useEffect, useCallback } from 'react'
import Navbar              from '../components/Navbar.jsx'
import StatsCard           from '../components/StatsCard.jsx'
import AlertsTable         from '../components/AlertsTable.jsx'
import AuditLogTable       from '../components/AuditLogTable.jsx'
import ClassificationBadge from '../components/ClassificationBadge.jsx'
import api                 from '../api/axios.js'

// ── Helper ──────────────────────────────────────────────────────────
const fmtDate = (ts) => ts ? new Date(ts).toLocaleString() : '—'

function exportCSV(logs) {
  const headers = ['ID','User','Action','Filename','Classification','Result','Timestamp','IP']
  const rows    = logs.map((l) => [
    l.id, l.username, l.action, `"${l.filename}"`,
    l.classification, l.result, fmtDate(l.timestamp), l.ip_address,
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = 'audit_logs.csv'; a.click()
  URL.revokeObjectURL(url)
}

// ── Tab icons ────────────────────────────────────────────────────────
const TAB_ICONS = {
  Overview:   '📊',
  Alerts:     '🔔',
  'Audit Logs': '📋',
  'Files & Users': '🗂️',
}

export default function AdminPage() {
  const [tab,      setTab]      = useState('Overview')
  const [stats,    setStats]    = useState(null)
  const [alerts,   setAlerts]   = useState([])
  const [logs,     setLogs]     = useState([])
  const [files,    setFiles]    = useState([])
  const [users,    setUsers]    = useState([])
  const [subTab,   setSubTab]   = useState('files') // files | users
  const [loading,  setLoading]  = useState(false)
  const [loadErr,  setLoadErr]  = useState(null)

  // Filter states
  const [alertSev,    setAlertSev]    = useState('')
  const [alertRead,   setAlertRead]   = useState('')
  const [logAction,   setLogAction]   = useState('')
  const [logResult,   setLogResult]   = useState('')
  const [fileClass,   setFileClass]   = useState('')
  const [fileBlocked, setFileBlocked] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadErr(null)
    try {
      const [s, a, l, f, u] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/alerts', { params: {
          ...(alertSev  ? { severity: alertSev }   : {}),
          ...(alertRead !== '' ? { is_read: alertRead === 'true' } : {}),
        }}),
        api.get('/admin/audit-logs', { params: {
          ...(logAction ? { action: logAction } : {}),
          ...(logResult ? { result: logResult } : {}),
        }}),
        api.get('/admin/files', { params: {
          ...(fileClass   ? { classification: fileClass }        : {}),
          ...(fileBlocked !== '' ? { is_blocked: fileBlocked === 'true' } : {}),
        }}),
        api.get('/admin/users'),
      ])
      setStats(s.data)
      setAlerts(a.data)
      setLogs(l.data)
      setFiles(f.data)
      setUsers(u.data)
    } catch (err) {
      console.error('[Admin] Data load failed:', err)
      setLoadErr('Failed to load admin data. Is the backend running?')
    } finally { setLoading(false) }
  }, [alertSev, alertRead, logAction, logResult, fileClass, fileBlocked])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    await api.patch(`/admin/alerts/${id}/read`)
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a))
  }

  const changeRole = async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role })
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
    } catch (err) {
      console.error('[Admin] Role change failed:', err)
    }
  }

  const toggleStatus = async (userId) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/status`)
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: data.is_active } : u))
    } catch (err) {
      console.error('[Admin] Status toggle failed:', err)
    }
  }

  const ROLE_BADGE = {
    admin:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    manager:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    employee: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Backend error banner */}
        {loadErr && (
          <div className="rounded-xl px-4 py-3 text-sm border bg-red-950/50 border-red-500/30 text-red-300 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span>{loadErr}</span>
            <button onClick={load} className="ml-auto btn-secondary text-xs">Retry</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-0.5">Security operations & monitoring</p>
          </div>
          <button onClick={load} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-800/50 rounded-xl w-fit border border-slate-700/50">
          {['Overview', 'Alerts', 'Audit Logs', 'Files & Users'].map((t) => (
            <button key={t} id={`tab-${t.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setTab(t)}
              className={tab === t ? 'tab-btn-active' : 'tab-btn'}>
              {TAB_ICONS[t]} {t}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Overview ─────────────────────────────────── */}
        {tab === 'Overview' && stats && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard title="Total Files"     value={stats.total_files}   color="blue"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>} />
              <StatsCard title="Blocked Files"   value={stats.blocked_files} color="red"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/></svg>} />
              <StatsCard title="Total Users"     value={stats.total_users}   color="purple"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>} />
              <StatsCard title="Unread Alerts"   value={stats.unread_alerts}  color="amber"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>} />
              <StatsCard title="Activity (24h)"  value={stats.recent_activity_count_24h} color="cyan"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/></svg>} />
              <StatsCard title="Restricted Files" value={stats.files_by_classification?.RESTRICTED ?? 0} color="red"
                icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>} />
            </div>

            {/* Classification breakdown */}
            <div className="card">
              <h3 className="font-semibold text-slate-300 mb-4">Classification Breakdown</h3>
              {(['PUBLIC', 'CONFIDENTIAL', 'RESTRICTED']).map((cls) => {
                const total = stats.total_files || 1
                const count = stats.files_by_classification?.[cls] ?? 0
                const pct   = Math.round((count / total) * 100)
                const color = cls === 'PUBLIC' ? 'bg-emerald-500' : cls === 'CONFIDENTIAL' ? 'bg-amber-500' : 'bg-red-500'
                return (
                  <div key={cls} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-400">{cls}</span>
                      <span className="text-slate-300 font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: Alerts ───────────────────────────────────── */}
        {tab === 'Alerts' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap gap-3">
              <select value={alertSev} onChange={(e) => setAlertSev(e.target.value)}
                className="input-field w-auto text-sm">
                <option value="">All Severities</option>
                {['low','medium','high','critical'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={alertRead} onChange={(e) => setAlertRead(e.target.value)}
                className="input-field w-auto text-sm">
                <option value="">All Status</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
            <AlertsTable alerts={alerts} onMarkRead={markRead} />
          </div>
        )}

        {/* ── TAB 3: Audit Logs ───────────────────────────────── */}
        {tab === 'Audit Logs' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap gap-3">
              <select value={logAction} onChange={(e) => setLogAction(e.target.value)}
                className="input-field w-auto text-sm">
                <option value="">All Actions</option>
                {['upload','download','share','delete','block'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <select value={logResult} onChange={(e) => setLogResult(e.target.value)}
                className="input-field w-auto text-sm">
                <option value="">All Results</option>
                <option value="allowed">Allowed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <AuditLogTable logs={logs} onExportCSV={() => exportCSV(logs)} />
          </div>
        )}

        {/* ── TAB 4: Files & Users ────────────────────────────── */}
        {tab === 'Files & Users' && (
          <div className="space-y-4 animate-fade-in">
            {/* Sub-tabs */}
            <div className="flex gap-1 p-1 bg-navy-800/50 rounded-xl w-fit border border-slate-700/50">
              {['files', 'users'].map((s) => (
                <button key={s} onClick={() => setSubTab(s)}
                  className={subTab === s ? 'tab-btn-active' : 'tab-btn'}>
                  {s === 'files' ? '📄 Files' : '👥 Users'}
                </button>
              ))}
            </div>

            {subTab === 'files' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <select value={fileClass} onChange={(e) => setFileClass(e.target.value)}
                    className="input-field w-auto text-sm">
                    <option value="">All Classifications</option>
                    {['PUBLIC','CONFIDENTIAL','RESTRICTED'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select value={fileBlocked} onChange={(e) => setFileBlocked(e.target.value)}
                    className="input-field w-auto text-sm">
                    <option value="">All Files</option>
                    <option value="false">Allowed</option>
                    <option value="true">Blocked</option>
                  </select>
                </div>
                <div className="card p-0 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50 bg-navy-900/50">
                          <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Filename</th>
                          <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Classification</th>
                          <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Uploader</th>
                          <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Status</th>
                          <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Uploaded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((f) => (
                          <tr key={f.id} className="table-row">
                            <td className="px-5 py-3 text-slate-300 max-w-[200px] truncate">{f.original_filename}</td>
                            <td className="px-5 py-3"><ClassificationBadge classification={f.classification} /></td>
                            <td className="px-5 py-3 text-slate-400">{f.uploader?.username ?? '—'}</td>
                            <td className="px-5 py-3">
                              {f.is_blocked
                                ? <span className="text-xs font-semibold text-red-400">Blocked</span>
                                : <span className="text-xs font-semibold text-emerald-400">Stored</span>
                              }
                            </td>
                            <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                              {fmtDate(f.upload_time)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {subTab === 'users' && (
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-navy-900/50">
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Username</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Email</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Role</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Joined</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Status</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Change Role</th>
                        <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="table-row">
                          <td className="px-5 py-3 font-medium text-slate-200">{u.username}</td>
                          <td className="px-5 py-3 text-slate-400">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_BADGE[u.role] ?? ''}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(u.created_at)}</td>
                          <td className="px-5 py-3">
                            {u.is_active
                              ? <span className="text-xs text-emerald-400 font-semibold">Active</span>
                              : <span className="text-xs text-red-400 font-semibold">Inactive</span>
                            }
                          </td>
                          <td className="px-5 py-3">
                            <select
                              id={`role-select-${u.id}`}
                              value={u.role}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              className="bg-navy-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-300
                                         focus:outline-none focus:ring-1 focus:ring-blue-500">
                              <option value="employee">employee</option>
                              <option value="manager">manager</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              id={`status-toggle-${u.id}`}
                              onClick={() => toggleStatus(u.id)}
                              className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                                u.is_active
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}>
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
