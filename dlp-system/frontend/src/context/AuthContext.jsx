import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const SESSION_TOKEN_KEY = 'dlp_token'
const SESSION_USER_KEY  = 'dlp_user'

export function AuthProvider({ children }) {
  // Initialise from sessionStorage so refresh doesn't log users out.
  // sessionStorage is tab-scoped and cleared when the browser tab is closed.
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_TOKEN_KEY))
  const [user,  setUser]  = useState(() => {
    const saved = sessionStorage.getItem(SESSION_USER_KEY)
    try { return saved ? JSON.parse(saved) : null } catch { return null }
  })

  const login = useCallback((accessToken, userData) => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken)
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
    sessionStorage.removeItem(SESSION_USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, role: user?.role ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
