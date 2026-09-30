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

  getSession(token) {
    return apiRequest(`${AUTH_BASE}/session/`, {
      token,
    })
  },

  logout(token) {
    return apiRequest(`${AUTH_BASE}/logout/`, {
      method: 'POST',
      token,
    })
  },
}