const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (response.status === 204) return null

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

const getErrorMessage = (data, fallback) => {
  if (!data) return fallback
  if (typeof data === 'string') return data || fallback
  if (typeof data.detail === 'string') return data.detail
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error

  const firstFieldError = Object.values(data).find((value) => {
    return typeof value === 'string' || Array.isArray(value)
  })

  if (Array.isArray(firstFieldError)) return firstFieldError.join(' ')
  if (typeof firstFieldError === 'string') return firstFieldError

  return fallback
}

export const apiRequest = async (path, options = {}) => {
  if (!API_BASE_URL) {
    throw new ApiError('API base URL is not configured. Set VITE_API_BASE_URL.')
  }

  const {
    method = 'GET',
    body,
    token,
    headers = {},
    signal,
  } = options

  const requestHeaders = new Headers(headers)

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  const isFormData = body instanceof FormData
  let requestBody = body

  if (body && !isFormData && typeof body === 'object') {
    requestHeaders.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, 'Request failed.'), {
      status: response.status,
      data,
    })
  }

  return data
}