import { useState, useEffect, useCallback } from 'react'
import Navbar              from '../components/Navbar.jsx'
import ClassificationBadge from '../components/ClassificationBadge.jsx'
import api                 from '../api/axios.js'

const fmtSize = (b) => !b ? '—' : b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(2)} MB`
const fmtDate = (ts) => ts ? new Date(ts).toLocaleString() : '—'

export default function MyFilesPage() {
  const [files,        setFiles]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [loadError,    setLoadError]    = useState(null)
  const [filterClass,  setFilterClass]  = useState('ALL')
  const [shareModal,   setShareModal]   = useState(null)
  const [shareTarget,  setShareTarget]  = useState('')
  const [shareResult,  setShareResult]  = useState(null)
  const [actionMsg,    setActionMsg]    = useState(null)
  // Delete confirmation modal instead of window.confirm()
  const [deleteModal,  setDeleteModal]  = useState(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data } = await api.get('/files/')
      setFiles(data)
    } catch (err) {
      console.error('[MyFiles] Failed to load files:', err)
      setLoadError('Could not load files. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFiles() }, [loadFiles])

  const handleDownload = async (file) => {
    try {
      // Step 1: ask backend for the presigned URL + original filename
      const { data } = await api.get(`/files/${file.id}/download`)
      const presignedUrl = data.presigned_url
      const originalName = data.filename ?? file.original_filename

      // Step 2: build the absolute URL, appending the original filename so the
      //         backend sets the correct Content-Disposition header
      const base = presignedUrl.startsWith('/')
        ? `http://localhost:8000${presignedUrl}`
        : presignedUrl
      const fetchUrl = `${base}?filename=${encodeURIComponent(originalName)}`

      // Step 3: fetch as blob and trigger a named download — this guarantees
      //         the browser saves the file with the original filename, not the UUID
      const response = await fetch(fetchUrl)
      if (!response.ok) throw new Error(`Download failed: ${response.status}`)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = originalName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
      console.error('[MyFiles] Download error:', e)
      setActionMsg({ type: 'error', text: e.response?.data?.detail ?? 'Download failed' })
    }
  }

  const handleShare = async () => {
    if (!shareTarget.trim()) return
    try {
      const { data } = await api.post(`/files/${shareModal.id}/share`, { target_username: shareTarget })
      setShareResult(data)
    } catch (e) {
      console.error('[MyFiles] Share error:', e)
      setShareResult({ shared: false, reason: e.response?.data?.detail ?? 'Share failed' })
    }
  }

  // Actual delete — called after modal confirmation
  const confirmDelete = async () => {
    const file = deleteModal
    setDeleteModal(null)
    try {
      await api.delete(`/files/${file.id}`)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      setActionMsg({ type: 'success', text: 'File deleted successfully' })
    } catch (e) {
      console.error('[MyFiles] Delete error:', e)
      setActionMsg({ type: 'error', text: e.response?.data?.detail ?? 'Delete failed' })
    }
  }

  const closeModal = () => { setShareModal(null); setShareTarget(''); setShareResult(null) }

  const filtered = filterClass === 'ALL'
    ? files
    : files.filter((f) => f.classification === filterClass)

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Files</h1>
            <p className="text-slate-400 text-sm mt-0.5">{files.length} file{files.length !== 1 ? 's' : ''} stored</p>
          </div>
          <div className="flex gap-2">
            {['ALL', 'PUBLIC', 'CONFIDENTIAL', 'RESTRICTED'].map((c) => (
              <button key={c} onClick={() => setFilterClass(c)}
                className={filterClass === c ? 'tab-btn-active text-xs' : 'tab-btn text-xs'}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className={`rounded-xl px-4 py-3 text-sm border animate-fade-in
            ${actionMsg.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/50 border-red-500/30 text-red-300'
            }`}>
            {actionMsg.text}
            <button onClick={() => setActionMsg(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Files table */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            Loading files…
          </div>
        ) : loadError ? (
          <div className="card border-red-500/30 bg-red-950/20 text-red-300 text-sm flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-semibold">Connection Error</p>
              <p className="text-red-400 mt-0.5">{loadError}</p>
              <button onClick={loadFiles} className="btn-secondary mt-3 text-xs">Retry</button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16 text-slate-500">
            <div className="text-5xl mb-3">📂</div>
            <p className="font-medium text-slate-400">No files found</p>
            <p className="text-sm mt-1">Upload a file from the Dashboard</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-navy-900/50">
                    <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Filename</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Classification</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Uploaded</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Size</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-medium">SHA-256</th>
                    <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id} className="table-row">
                      <td className="px-5 py-3.5 font-medium text-slate-200 max-w-[200px] truncate" title={f.original_filename}>
                        {f.original_filename}
                      </td>
                      <td className="px-5 py-3.5">
                        <ClassificationBadge classification={f.classification} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {fmtDate(f.upload_time)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{fmtSize(f.file_size_bytes)}</td>
                      <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">
                        {f.sha256_hash?.slice(0, 16)}…
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button id={`download-btn-${f.id}`} onClick={() => handleDownload(f)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 bg-blue-500/10 rounded-lg hover:bg-blue-500/20">
                            Download
                          </button>
                          <button id={`share-btn-${f.id}`} onClick={() => setShareModal(f)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20">
                            Share
                          </button>
                          <button id={`delete-btn-${f.id}`} onClick={() => setDeleteModal(f)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 bg-red-500/10 rounded-lg hover:bg-red-500/20">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-sm animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">Delete File</h3>
                  <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-5">
                Are you sure you want to delete <span className="text-slate-200 font-medium">"{deleteModal.original_filename}"</span>?
              </p>
              <div className="flex gap-3">
                <button id="confirm-delete-btn" onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  Delete
                </button>
                <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Share modal */}
        {shareModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card w-full max-w-md animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200">Share File</h3>
                <button onClick={closeModal} className="text-slate-500 hover:text-slate-300">✕</button>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Sharing: <span className="text-slate-200 font-medium">{shareModal.original_filename}</span>
                <span className="ml-2"><ClassificationBadge classification={shareModal.classification} /></span>
              </p>
              {!shareResult ? (
                <>
                  <input id="share-username-input" type="text" value={shareTarget}
                    onChange={(e) => setShareTarget(e.target.value)}
                    placeholder="Target username"
                    className="input-field mb-4"
                    onKeyDown={(e) => e.key === 'Enter' && handleShare()} />
                  <div className="flex gap-3">
                    <button onClick={handleShare} className="btn-primary flex-1">Share</button>
                    <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  </div>
                </>
              ) : (
                <div className={`rounded-xl px-4 py-3 border text-sm ${
                  shareResult.shared
                    ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/50 border-red-500/30 text-red-300'
                }`}>
                  <p>{shareResult.shared ? '✅ ' : '🚫 '}{shareResult.reason}</p>
                  <button onClick={closeModal} className="btn-secondary mt-3 w-full">Close</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
