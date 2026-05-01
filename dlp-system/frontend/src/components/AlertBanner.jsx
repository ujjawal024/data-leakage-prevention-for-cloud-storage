/**
 * AlertBanner — dismissable red error banner with pattern tags.
 * Props: message, details, patterns (array), onDismiss
 */
export default function AlertBanner({ message, details, patterns = [], onDismiss }) {
  return (
    <div className="animate-fade-in relative bg-red-950/60 border border-red-500/40 rounded-2xl p-5
                    shadow-xl shadow-red-900/30 backdrop-blur">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="shrink-0 w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center mt-0.5">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-red-300 text-base">🚫 Upload Blocked</h4>
          <p className="text-red-200 mt-1 text-sm">{message}</p>
          {details && <p className="text-red-300/70 mt-1 text-xs">{details}</p>}

          {patterns.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-red-400/70 mr-1">Detected:</span>
              {patterns.map((p) => (
                <span key={p}
                  className="px-2 py-0.5 bg-red-500/20 border border-red-500/30
                             text-red-300 text-xs rounded-full font-medium">
                  {p.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors p-1 rounded-lg
                       hover:bg-red-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
