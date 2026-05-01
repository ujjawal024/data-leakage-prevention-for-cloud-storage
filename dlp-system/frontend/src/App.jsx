import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { setLogoutHandler, setTokenGetter } from './api/axios.js'

import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage      from './pages/LoginPage.jsx'
import RegisterPage   from './pages/RegisterPage.jsx'
import DashboardPage  from './pages/DashboardPage.jsx'
import MyFilesPage    from './pages/MyFilesPage.jsx'
import AdminPage      from './pages/AdminPage.jsx'

function AppInner() {
  const { logout, token } = useAuth()

  // Wire up axios interceptors once auth context is available
  useEffect(() => {
    setLogoutHandler(logout)
    setTokenGetter(() => token)
  }, [logout, token])

  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />
      <Route path="/my-files" element={
        <ProtectedRoute><MyFilesPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  )
}
