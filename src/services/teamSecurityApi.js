import { apiRequest } from './apiClient'

const SECURITY_BASE = '/api/v1/team-dashboard/security'

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const teamSecurityApi = {
  getDataProtectionPrefill(token, options = {}) {
    return apiRequest(`${SECURITY_BASE}/data-protection/prefill/`, {
      token,
      signal: options.signal,
    })
  },

  getDataProtectionOptions(token, options = {}) {
    return apiRequest(`${SECURITY_BASE}/data-protection/options/`, {
      token,
      signal: options.signal,
    })
  },

  submitDataProtectionRequest(token, payload) {
    return apiRequest(`${SECURITY_BASE}/data-protection/submit/`, {
      method: 'POST',
      token,
      body: payload,
    })
  },

  listDataProtectionRequests(token, params = {}, options = {}) {
    return apiRequest(`${SECURITY_BASE}/data-protection/my-requests/${buildQuery(params)}`, {
      token,
      signal: options.signal,
    })
  },

  getDeleteAccountInfo(token, options = {}) {
    return apiRequest(`${SECURITY_BASE}/delete-account/info/`, {
      token,
      signal: options.signal,
    })
  },
}