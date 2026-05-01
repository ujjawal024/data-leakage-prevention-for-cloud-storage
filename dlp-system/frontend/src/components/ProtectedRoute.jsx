import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * Optionally accepts `requiredRole` to further restrict access.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { token, role } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
