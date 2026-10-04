import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { teamAuthApi } from '../services/teamAuthApi'

const SESSION_STORAGE_KEY = 'rightroute_team_dashboard_session'
const PENDING_LOGIN_KEY = 'rightroute_team_dashboard_pending_login'

const readJson = (key) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const normalizeSession = (data) => {
  if (!data) return null

  const user = data.user || {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    is_super_admin: data.is_super_admin,
  }

  return {
    accessToken: data.access_token || data.accessToken || null,
    refreshToken: data.refresh_token || data.refreshToken || null,
    user,
    team: data.team || null,
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  }
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readJson(SESSION_STORAGE_KEY))
  const [pendingLogin, setPendingLogin] = useState(() => readJson(PENDING_LOGIN_KEY))
  const [isSessionLoading, setIsSessionLoading] = useState(Boolean(readJson(SESSION_STORAGE_KEY)?.accessToken))

  const persistSession = useCallback((nextSession) => {
    if (!nextSession) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      setSession(null)
      return
    }

    writeJson(SESSION_STORAGE_KEY, nextSession)
    setSession(nextSession)
  }, [])

  const clearPendingLogin = useCallback(() => {
    localStorage.removeItem(PENDING_LOGIN_KEY)
    setPendingLogin(null)
  }, [])

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const response = await teamAuthApi.login({
      email,
      password,
      remember_me: Boolean(rememberMe),
    })

    const nextPendingLogin = {
      email: response.email || email,
      maskedEmail: response.masked_email || response.email || email,
      message: response.message || '',
    }

    writeJson(PENDING_LOGIN_KEY, nextPendingLogin)
    setPendingLogin(nextPendingLogin)

    return response
  }, [])

  const verifyOtp = useCallback(async ({ email, otpCode }) => {
    const response = await teamAuthApi.verifyOtp({
      email,
      otp_code: otpCode,
    })

    const normalized = normalizeSession(response)
    persistSession(normalized)
    setIsSessionLoading(false)
    clearPendingLogin()

    return normalized
  }, [clearPendingLogin, persistSession])

  const resendOtp = useCallback(async (email) => {
    const response = await teamAuthApi.resendOtp({ email })

    const nextPendingLogin = {
      email: response.email || email,
      maskedEmail: response.masked_email || response.email || email,
      message: response.message || '',
    }

    writeJson(PENDING_LOGIN_KEY, nextPendingLogin)
    setPendingLogin(nextPendingLogin)

    return response
  }, [])

  const clearSession = useCallback(() => {
    persistSession(null)
    clearPendingLogin()
  }, [clearPendingLogin, persistSession])

  const logout = useCallback(async () => {
    const token = session?.accessToken

    try {
      if (token) {
        await teamAuthApi.logout(token)
      }
    } finally {
      clearSession()
    }
  }, [clearSession, session?.accessToken])

  const refreshSession = useCallback(async () => {
    const token = readJson(SESSION_STORAGE_KEY)?.accessToken

    if (!token) {
      setIsSessionLoading(false)
      return null
    }

    try {
      const response = await teamAuthApi.getSession(token)
      const currentSession = readJson(SESSION_STORAGE_KEY)
      const normalized = normalizeSession({
        ...response,
        access_token: currentSession?.accessToken,
        refresh_token: currentSession?.refreshToken,
      })
      persistSession(normalized)
      return normalized
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearSession()
      }
      throw error
    } finally {
      setIsSessionLoading(false)
    }
  }, [clearSession, persistSession])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      refreshSession().catch(() => {
        setIsSessionLoading(false)
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [refreshSession])

  const isSuperAdmin = Boolean(session?.user?.is_super_admin)

  const can = useCallback((permission) => {
    if (!permission) return true
    if (isSuperAdmin) return true
    return session?.permissions?.includes(permission) || false
  }, [isSuperAdmin, session?.permissions])

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    team: session?.team || null,
    permissions: session?.permissions || [],
    accessToken: session?.accessToken || null,
    pendingLogin,
    isAuthenticated: Boolean(session?.accessToken),
    isSessionLoading,
    isSuperAdmin,
    can,
    login,
    verifyOtp,
    resendOtp,
    logout,
    clearSession,
    refreshSession,
  }), [
    can,
    clearSession,
    isSessionLoading,
    isSuperAdmin,
    login,
    logout,
    pendingLogin,
    refreshSession,
    resendOtp,
    session,
    verifyOtp,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}