const fmtDate = (ts) => ts ? new Date(ts).toLocaleString() : '—'

/**
 * AuditLogTable — renders paginated audit log entries.
 * Props: logs (array), onExportCSV fn
 */
export default function AuditLogTable({ logs = [], onExportCSV }) {
  if (!logs.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-4xl mb-3">📋</div>
        <p>No audit logs found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {onExportCSV && (
        <div className="flex justify-end">
          <button
            id="export-csv-btn"
            onClick={onExportCSV}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-navy-900/50">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Filename</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Classification</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Result</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Timestamp</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="table-row">
                <td className="px-4 py-3 font-medium text-slate-300">{l.username ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded text-xs font-mono uppercase">
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate" title={l.filename}>
                  {l.filename}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{l.classification || '—'}</td>
                <td className="px-4 py-3">
                  {l.result === 'allowed'
                    ? <span className="text-xs font-semibold text-emerald-400">✓ allowed</span>
                    : <span className="text-xs font-semibold text-red-400">✗ blocked</span>
                  }
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                  {fmtDate(l.timestamp)}
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                  {l.ip_address || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
