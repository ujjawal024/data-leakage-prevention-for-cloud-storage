import { useState, useEffect, useCallback } from 'react'
import Navbar              from '../components/Navbar.jsx'
import FileDropzone        from '../components/FileDropzone.jsx'
import ClassificationBadge from '../components/ClassificationBadge.jsx'
import AlertBanner         from '../components/AlertBanner.jsx'
import { useAuth }         from '../context/AuthContext.jsx'
import api                 from '../api/axios.js'

const fmtSize  = (b) => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(2)} MB`
const fmtDate  = (ts) => ts ? new Date(ts).toLocaleString() : '—'
const truncate = (s, n=40) => s?.length > n ? s.slice(0, n)+'…' : s

export default function DashboardPage() {
  const { user, role } = useAuth()
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)  // success response
  const [blockInfo,  setBlockInfo]  = useState(null)  // blocked response
  const [recentFiles, setRecentFiles] = useState([])

  const loadRecent = useCallback(async () => {
    try {
      const { data } = await api.get('/files/')
      setRecentFiles(data.slice(0, 5))
    } catch {}
  }, [])

  useEffect(() => { loadRecent() }, [loadRecent])

  const handleUpload = async (file) => {
    setLoading(true)
    setResult(null)
    setBlockInfo(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/files/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      loadRecent()
    } catch (e) {
      const detail = e.response?.data?.detail
      if (typeof detail === 'object' && detail?.blocked) {
        setBlockInfo(detail)
      } else {
        setBlockInfo({ blocked: true, reason: detail ?? 'Upload failed', detected_patterns: [] })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome banner */}
        <div className="card bg-gradient-to-r from-blue-600/20 to-cyan-600/10 border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/30 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Welcome back, <span className="gradient-text">{user?.username}</span>
              </h1>
              <p className="text-slate-400 mt-0.5 text-sm">
                You are signed in as&nbsp;
                <span className={`font-semibold ${
                  role === 'admin' ? 'text-purple-400'
                  : role === 'manager' ? 'text-blue-400'
                  : 'text-emerald-400'
                }`}>{role}</span>
                {role === 'employee' && ' · Can upload PUBLIC files only'}
                {role === 'manager'  && ' · Can upload PUBLIC and CONFIDENTIAL files'}
                {role === 'admin'    && ' · Full access to all classifications'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload panel */}
          <div className="space-y-5">
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-200 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Secure File Upload
              </h2>
              <p className="text-slate-500 text-sm mb-4">
                Files are scanned by the DLP pipeline before being stored.
              </p>
              <FileDropzone onUpload={handleUpload} loading={loading} />
            </div>

            {/* DLP pipeline steps */}
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">DLP Pipeline</h3>
              <div className="space-y-2">
                {[
                  'Content Inspection',
                  'Pattern Matching',
                  'Data Classification',
                  'SHA-256 Hashing',
                  'Fingerprint Check',
                  'RBAC Policy Evaluation',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                    ${loading ? 'bg-blue-500/30 text-blue-400 animate-pulse-slow' : 'bg-slate-700 text-slate-400'}`}>
                      {i + 1}
                    </div>
                    <span className={loading ? 'text-blue-300' : 'text-slate-500'}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div className="space-y-5">
            {/* Block result */}
            {blockInfo && (
              <AlertBanner
                message={blockInfo.reason}
                details={`Classification: ${blockInfo.classification ?? '—'}`}
                patterns={blockInfo.detected_patterns ?? []}
                onDismiss={() => setBlockInfo(null)}
              />
            )}

            {/* Success result */}
            {result && (
              <div className="card border-emerald-500/30 bg-emerald-950/20 animate-fade-in space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-emerald-400">Upload Successful</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">Filename</p>
                    <p className="text-slate-200 break-all">{result.filename}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Classification</p>
                    <div className="mt-0.5"><ClassificationBadge classification={result.classification} /></div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">File Size</p>
                    <p className="text-slate-200">{fmtSize(result.file_size_bytes)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Duplicate</p>
                    <p className={result.is_duplicate ? 'text-amber-400' : 'text-emerald-400'}>
                      {result.is_duplicate ? 'Yes (exact copy)' : 'No'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-500 text-xs">SHA-256 Hash</p>
                    <p className="text-slate-400 font-mono text-xs break-all mt-0.5">{result.sha256_hash}</p>
                  </div>
                  {result.detected_patterns?.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-slate-500 text-xs mb-1">Detected Patterns</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.detected_patterns.map((p) => (
                          <span key={p} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20
                                                   text-amber-300 text-xs rounded-full">
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Placeholder when no result yet */}
            {!result && !blockInfo && (
              <div className="card text-center py-12 text-slate-600">
                <div className="text-5xl mb-3">🛡️</div>
                <p className="font-medium text-slate-500">Upload a file to see DLP results</p>
              </div>
            )}

            {/* Recent uploads */}
            {recentFiles.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Recent Uploads</h3>
                <div className="space-y-2">
                  {recentFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm text-slate-300 truncate">{f.original_filename}</p>
                        <p className="text-xs text-slate-600">{fmtDate(f.upload_time)}</p>
                      </div>
                      <ClassificationBadge classification={f.classification} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
