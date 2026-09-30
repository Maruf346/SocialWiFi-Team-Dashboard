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

  sendEmailPasswordCode(token, action) {
    return apiRequest(`${MANAGE_BASE}/email-password/send-code/`, {
      method: 'POST',
      token,
      body: { action },
    })
  },

  changeEmail(token, payload) {
    return apiRequest(`${MANAGE_BASE}/email-password/change-email/`, {
      method: 'POST',
      token,
      body: payload,
    })
  },

  changePassword(token, payload) {
    return apiRequest(`${MANAGE_BASE}/email-password/change-password/`, {
      method: 'POST',
      token,
      body: payload,
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

  listAdminUsers(token, options = {}) {
    return apiRequest(`${MANAGE_BASE}/admin-users/`, {
      token,
      signal: options.signal,
    })
  },

  createAdminUser(token, payload) {
    return apiRequest(`${MANAGE_BASE}/admin-users/`, {
      method: 'POST',
      token,
      body: payload,
    })
  },

  getAdminUser(token, userId, options = {}) {
    return apiRequest(`${MANAGE_BASE}/admin-users/${userId}/`, {
      token,
      signal: options.signal,
    })
  },

  updateAdminUser(token, userId, payload) {
    return apiRequest(`${MANAGE_BASE}/admin-users/${userId}/`, {
      method: 'PATCH',
      token,
      body: payload,
    })
  },

  deleteAdminUser(token, userId) {
    return apiRequest(`${MANAGE_BASE}/admin-users/${userId}/`, {
      method: 'DELETE',
      token,
    })
  },

  lockAdminUser(token, userId) {
    return apiRequest(`${MANAGE_BASE}/admin-users/${userId}/lock/`, {
      method: 'POST',
      token,
    })
  },

  unlockAdminUser(token, userId) {
    return apiRequest(`${MANAGE_BASE}/admin-users/${userId}/unlock/`, {
      method: 'POST',
      token,
    })
  },

  bulkAdminAction(token, adminIds, action) {
    return apiRequest(`${MANAGE_BASE}/admin-users/bulk-action/`, {
      method: 'POST',
      token,
      body: { admin_ids: adminIds, action },
    })
  },

  generateAdminPassword(token) {
    return apiRequest(`${MANAGE_BASE}/admin-users/generate-password/`, {
      token,
    })
  },

  getPermissionsTree(token, options = {}) {
    return apiRequest(`${MANAGE_BASE}/permissions-tree/`, {
      token,
      signal: options.signal,
    })
  },
}