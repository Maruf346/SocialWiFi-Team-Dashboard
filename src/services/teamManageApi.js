import { apiRequest } from './apiClient'

const MANAGE_BASE = '/api/v1/team-dashboard/manage'

export const teamManageApi = {
  getPlan(token, options = {}) {
    return apiRequest(`${MANAGE_BASE}/plan/`, {
      token,
      signal: options.signal,
    })
  },
}