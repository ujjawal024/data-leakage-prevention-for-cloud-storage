import ClassificationBadge from './ClassificationBadge.jsx'

const SEVERITY_STYLES = {
  low:      'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const fmtDate = (ts) => ts ? new Date(ts).toLocaleString() : '—'

/**
 * AlertsTable — renders a list of DLP alerts with severity badges.
 * Props: alerts (array), onMarkRead(alertId) fn
 */
export default function AlertsTable({ alerts = [], onMarkRead }) {
  if (!alerts.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-medium">No alerts found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-navy-900/50">
            <th className="text-left px-4 py-3 text-slate-400 font-medium">Severity</th>
            <th className="text-left px-4 py-3 text-slate-400 font-medium">Reason</th>
            <th className="text-left px-4 py-3 text-slate-400 font-medium">Triggered By</th>
            <th className="text-left px-4 py-3 text-slate-400 font-medium">Time</th>
            <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id} className={`table-row ${a.is_read ? 'opacity-50' : ''}`}>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${SEVERITY_STYLES[a.severity] ?? ''}`}>
                  {a.severity}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={a.details}>
                {a.reason}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {a.triggered_by?.username ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {fmtDate(a.timestamp)}
              </td>
              <td className="px-4 py-3">
                {a.is_read
                  ? <span className="text-xs text-slate-600">Read</span>
                  : <span className="text-xs text-amber-400 font-medium">Unread</span>
                }
              </td>
              <td className="px-4 py-3">
                {!a.is_read && onMarkRead && (
                  <button
                    onClick={() => onMarkRead(a.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1
                               bg-blue-500/10 rounded-lg hover:bg-blue-500/20"
                  >
                    Mark Read
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
