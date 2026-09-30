import { NavLink, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../context/useAuth'

const menuGroups = [
  {
    title: 'MANAGE',
    items: [
      { label: 'Email/password', path: '/dashboard/manage/email', permission: 'manage.email_password' },
      { label: 'Admin users', path: '/dashboard/manage/admin-users', permission: 'manage.admin_users' },
      { label: 'Team users', path: '/dashboard/manage/team-users', permission: 'manage.team_users' },
      {
        label: 'Team driver route history',
        path: '/dashboard/manage/team-route-history',
        anyPermission: ['manage.route_history.team', 'manage.route_history.my'],
      },
      { label: 'Plan', path: '/dashboard/manage/plan', permission: 'manage.plan' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Contact support', path: '/dashboard/support/contact', permission: 'support.contact_support' },
      { label: 'Submit a support ticket', path: '/dashboard/support/submit-ticket', permission: 'support.submit_ticket' },
      { label: 'Resources', path: '/dashboard/support/resources', permission: 'support.resources' },
    ],
  },
  {
    title: 'LEGAL',
    items: [
      { label: 'Privacy Policy', path: '/dashboard/legal/privacy-policy', permission: 'legal.privacy_policy' },
      { label: 'Terms of Use', path: '/dashboard/legal/terms-of-use', permission: 'legal.terms_of_use' },
      { label: 'Disclaimer', path: '/dashboard/legal/disclaimer', permission: 'legal.disclaimer' },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { label: 'Logout', action: 'logout', permission: 'security.logout' },
      { label: 'Data protection', path: '/dashboard/security/data-protection', permission: 'security.data_protection' },
      { label: 'Delete account', path: '/dashboard/security/delete-account', permission: 'security.delete_account' },
    ],
  },
]

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { can, logout } = useAuth()

  const canSeeItem = (item) => {
    if (item.anyPermission) return item.anyPermission.some((permission) => can(permission))
    return can(item.permission)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav aria-label="Dashboard navigation" className="w-full overflow-hidden text-[11px] text-gray-600">
      {menuGroups.map((group, index) => {
        const visibleItems = group.items.filter(canSeeItem)

        if (!visibleItems.length) return null

        return (
          <section key={group.title} className={index === 0 ? 'pt-2' : ''}>
            <h2 className="bg-[#1d2464] px-3 py-1.5 text-left text-[12px] font-medium tracking-wide text-white">
              {group.title}
            </h2>

            <ul>
              {visibleItems.map((item) => {
                if (item.action === 'logout') {
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full border-b border-white bg-[#f1f1f1] px-3 py-2 text-left font-medium text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                }

                const isRouteLink = item.path && item.path !== '#'

                if (isRouteLink) {
                  const isAdminUsersActive =
                    item.label === 'Admin users' &&
                    (
                      location.pathname === '/dashboard/manage/admin-users' ||
                      location.pathname === '/dashboard/manage/admin-users/add-user' ||
                      location.pathname.startsWith('/dashboard/manage/admin-users/edit/') ||
                      location.pathname === '/dashboard/add-user'
                    )

                  const isRouteHistoryActive =
                    item.label === 'Team driver route history' &&
                    location.pathname.startsWith('/dashboard/manage/team-route-history')

                  return (
                    <li key={item.label}>
                      <NavLink
                        to={item.path}
                        className={() =>
                          `block border-b border-white px-3 py-2 font-medium transition-colors ${
                            isAdminUsersActive || isRouteHistoryActive || (item.path === location.pathname && item.label !== 'Admin users')
                              ? 'bg-[#ff823d] text-white'
                              : 'bg-[#f1f1f1] text-gray-600 hover:bg-gray-200'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  )
                }

                return null
              })}
            </ul>
          </section>
        )
      })}
    </nav>
  )
}

export default Sidebar