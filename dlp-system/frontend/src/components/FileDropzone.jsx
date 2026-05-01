import { useRef, useState } from 'react'

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.sh', '.ps1', '.msi', '.cmd']
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB

/**
 * FileDropzone — drag-and-drop + click-to-browse file picker.
 * Props: onUpload(file) async fn, loading bool
 */
export default function FileDropzone({ onUpload, loading }) {
  const [dragging, setDragging]     = useState(false)
  const [selected, setSelected]     = useState(null)
  const [preError, setPreError]     = useState(null)
  const inputRef = useRef(null)

  const validate = (file) => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return `Executable files (${ext}) are not permitted`
    }
    if (file.size > MAX_SIZE) {
      return 'File exceeds 50 MB limit'
    }
    return null
  }

  const handleFile = (file) => {
    setPreError(null)
    const err = validate(file)
    if (err) { setPreError(err); return }
    setSelected(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleUpload = () => {
    if (selected && onUpload) onUpload(selected)
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        id="file-dropzone"
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`
          relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-200
          ${dragging
            ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-600 hover:border-blue-500/50 hover:bg-navy-700/50'
          }
          ${loading ? 'cursor-not-allowed opacity-70' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
          id="file-input"
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-blue-400 font-medium">Analyzing file for sensitive data…</p>
            <p className="text-slate-500 text-sm">Running DLP pipeline</p>
          </div>
        ) : selected ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-slate-200 break-all">{selected.name}</p>
            <p className="text-slate-400 text-sm">{formatSize(selected.size)}</p>
            <p className="text-xs text-slate-500">Click to change file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-300">Drag & drop a file here</p>
              <p className="text-slate-500 text-sm mt-1">or click to browse • Max 50 MB</p>
            </div>
            <p className="text-xs text-slate-600">
              .exe .bat .sh .ps1 .msi .cmd are blocked
            </p>
          </div>
        )}
      </div>

      {/* Pre-validation error */}
      {preError && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
          ⚠️ {preError}
        </div>
      )}

      {/* Upload button */}
      {selected && !loading && (
        <button
          id="upload-btn"
          onClick={handleUpload}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Run DLP Check & Upload
        </button>
      )}
    </div>
  )
}
