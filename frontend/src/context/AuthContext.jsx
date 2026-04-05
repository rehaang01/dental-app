import { createContext, useState, useEffect } from 'react'
import { getMe, logout as apiLogout } from '../api'

// Exported so useAuth.js can consume it without circular deps
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)  // { username, displayName }
  const [loading, setLoading] = useState(true)  // true while checking session on startup

  // On first load, ask the server if we have a valid session cookie
  useEffect(() => {
    getMe()
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await apiLogout().catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}