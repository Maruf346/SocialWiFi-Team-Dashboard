import { NavLink, useLocation } from 'react-router'

const menuGroups = [
  {
    title: 'MANAGE',
    items: [
      { label: 'Email/password', path: '/dashboard/manage/email' },
      { label: 'Admin users', path: '/dashboard/manage/admin-users' },
      { label: 'Team users', path: '/dashboard/manage/team-users' },
      // { label: 'Team route history', path: '/dashboard/manage/team-route-history' },
      { label: 'Plan', path: '/dashboard/manage/plan' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Contact support', path: '/dashboard/support/contact' },
      { label: 'Submit a support ticket', path: '/dashboard/support/submit-ticket' },
      { label: 'Resources', path: '/dashboard/support/resources' },
    ],
  },
  {
    title: 'LEGAL',
    items: [
      { label: 'Privacy Policy', path: '/dashboard/legal/privacy-policy' },
      { label: 'Terms of Use', path: '/dashboard/legal/terms-of-use' },
      { label: 'Disclaimer', path: '/dashboard/legal/disclaimer' },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { label: 'Logout', path: '#' },
      { label: 'Data protection', path: '/dashboard/security/data-protection' },
      { label: 'Delete account', path: '/dashboard/security/delete-account' },
    ],
  },
]

const Sidebar = () => {
  const location = useLocation()

  return (
    <nav aria-label="Dashboard navigation" className="w-full overflow-hidden text-[11px] text-gray-600">
      {menuGroups.map((group, index) => (
        <section key={group.title} className={index === 0 ? 'pt-2' : ''}>
          <h2 className="bg-[#1d2464] px-3 py-1.5 text-left text-[12px] font-medium tracking-wide text-white">
            {group.title}
          </h2>

          <ul>
            {group.items.map((item) => {
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

                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      className={() =>
                        `block border-b border-white px-3 py-2 font-medium transition-colors ${
                          isAdminUsersActive || (item.path === location.pathname && item.label !== 'Admin users')
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

              return (
                <li key={item.label}>
                  <a
                    href="#"
                    className="block border-b border-white bg-[#f1f1f1] px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    {item.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}

export default Sidebar
