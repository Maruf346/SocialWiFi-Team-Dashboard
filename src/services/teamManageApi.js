import { apiRequest } from './apiClient'

const MANAGE_BASE = '/api/v1/team-dashboard/manage'

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

export const teamManageApi = {
  getPlan(token, options = {}) {
    return apiRequest(`${MANAGE_BASE}/plan/`, {
      token,
      signal: options.signal,
    })
  },

  listTeamUsers(token, params = {}, options = {}) {
    return apiRequest(`${MANAGE_BASE}/team-users/${buildQuery(params)}`, {
      token,
      signal: options.signal,
    })
  },

  addTeamUsers(token, users) {
    return apiRequest(`${MANAGE_BASE}/team-users/`, {
      method: 'POST',
      token,
      body: { users },
    })
  },

  updateTeamUser(token, memberId, payload) {
    return apiRequest(`${MANAGE_BASE}/team-users/${memberId}/`, {
      method: 'PATCH',
      token,
      body: payload,
    })
  },

  removeTeamUsers(token, memberIds) {
    return apiRequest(`${MANAGE_BASE}/team-users/remove/`, {
      method: 'POST',
      token,
      body: { member_ids: memberIds },
    })
  },

  importTeamUsers(token, file) {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest(`${MANAGE_BASE}/team-users/import/`, {
      method: 'POST',
      token,
      body: formData,
    })
  },

  downloadTeamUsers(token) {
    return apiRequest(`${MANAGE_BASE}/team-users/download/`, {
      token,
    })
  },
}