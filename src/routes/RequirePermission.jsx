import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/useAuth'

const RequirePermission = ({ permission, anyPermission, children }) => {
  const location = useLocation()
  const { can } = useAuth()

  const isAllowed = Array.isArray(anyPermission)
    ? anyPermission.some((item) => can(item))
    : can(permission)

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace state={{ deniedFrom: location.pathname }} />
  }

  return children
}

export default RequirePermission