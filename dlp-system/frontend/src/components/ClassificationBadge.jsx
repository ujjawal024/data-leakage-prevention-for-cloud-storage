/**
 * ClassificationBadge — displays a color-coded pill for file classification.
 * Props: classification ("PUBLIC" | "CONFIDENTIAL" | "RESTRICTED")
 */
export default function ClassificationBadge({ classification }) {
  if (classification === 'RESTRICTED') {
    return (
      <span className="badge-restricted">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd" />
        </svg>
        RESTRICTED
      </span>
    )
  }

  if (classification === 'CONFIDENTIAL') {
    return (
      <span className="badge-confidential">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd" />
        </svg>
        CONFIDENTIAL
      </span>
    )
  }

  return (
    <span className="badge-public">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd" />
      </svg>
      PUBLIC
    </span>
  )
}
