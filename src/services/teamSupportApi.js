import { apiRequest } from './apiClient'

const SUPPORT_BASE = '/api/v1/team-dashboard/support'

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

export const teamSupportApi = {
  getContactInfo(token, options = {}) {
    return apiRequest(`${SUPPORT_BASE}/contact-info/`, {
      token,
      signal: options.signal,
    })
  },

  listResources(token, params = {}, options = {}) {
    return apiRequest(`${SUPPORT_BASE}/resources/${buildQuery(params)}`, {
      token,
      signal: options.signal,
    })
  },

  downloadResource(token, resourceId) {
    return apiRequest(`${SUPPORT_BASE}/resources/${resourceId}/download/`, {
      token,
    })
  },

  getTicketPrefill(token, options = {}) {
    return apiRequest(`${SUPPORT_BASE}/prefill/`, {
      token,
      signal: options.signal,
    })
  },

  getTopics(token, options = {}) {
    return apiRequest(`${SUPPORT_BASE}/topics/`, {
      token,
      signal: options.signal,
    })
  },

  submitTicket(token, payload) {
    const formData = new FormData()

    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'uploaded_files') {
        value.forEach((file) => formData.append('uploaded_files', file))
      } else if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })

    return apiRequest(`${SUPPORT_BASE}/submit-ticket/`, {
      method: 'POST',
      token,
      body: formData,
    })
  },
}