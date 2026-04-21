import { createContext, useState, useEffect, useCallback } from 'react'
import { getMe } from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario,      setUsuario]      = useState(null)
  const [token,        setToken]        = useState(() => localStorage.getItem('token'))
  const [loading,      setLoading]      = useState(true)
  const [upgradeModal, setUpgradeModal] = useState({ visible: false, recurso: '', limite: 0 })

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(({ data }) => setUsuario(data.data.usuario))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    const handler = (e) => {
      const { recurso, limite } = e.detail ?? {}
      setUpgradeModal({ visible: true, recurso: recurso ?? '', limite: limite ?? 0 })
    }
    window.addEventListener('quota:limite', handler)
    return () => window.removeEventListener('quota:limite', handler)
  }, [])

  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue)
    setToken(tokenValue)
    setUsuario(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUsuario(null)
  }

  const showUpgrade  = useCallback((recurso, limite) => setUpgradeModal({ visible: true, recurso, limite }), [])
  const hideUpgrade  = useCallback(() => setUpgradeModal({ visible: false, recurso: '', limite: 0 }), [])

  return (
    <AuthContext.Provider value={{ usuario, token, loading, login, logout, upgradeModal, showUpgrade, hideUpgrade }}>
      {children}
    </AuthContext.Provider>
  )
}
