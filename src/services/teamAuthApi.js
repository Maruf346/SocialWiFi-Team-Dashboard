import { apiRequest } from './apiClient'

const AUTH_BASE = '/api/v1/team-dashboard/auth'

export const teamAuthApi = {
  login(payload) {
    return apiRequest(`${AUTH_BASE}/login/`, {
      method: 'POST',
      body: payload,
    })
  },

  verifyOtp(payload) {
    return apiRequest(`${AUTH_BASE}/verify-otp/`, {
      method: 'POST',
      body: payload,
    })
  },

  resendOtp(payload) {
    return apiRequest(`${AUTH_BASE}/resend-otp/`, {
      method: 'POST',
      body: payload,
    })
  },

  async forgotPassword(payload) {
    try {
      return await apiRequest(`${AUTH_BASE}/forgot-password/`, {
        method: 'POST',
        body: payload,
      })
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        try {
          return await apiRequest(`${AUTH_BASE}/password-reset/`, {
            method: 'POST',
            body: payload,
          })
        } catch (err2) {
          if (err2.status === 404 || err2.status === 405) {
            return await apiRequest(`${AUTH_BASE}/resend-otp/`, {
              method: 'POST',
              body: payload,
            })
          }
          throw err2
        }
      }
      throw err
    }
  },

  getSession(token) {
    return apiRequest(`${AUTH_BASE}/session/`, {
      token,
    })
  },

  logout(token, refreshToken) {
    const body = refreshToken
      ? { refresh_token: refreshToken, refresh: refreshToken }
      : {}

    return apiRequest(`${AUTH_BASE}/logout/`, {
      method: 'POST',
      token,
      body,
    })
  },
}