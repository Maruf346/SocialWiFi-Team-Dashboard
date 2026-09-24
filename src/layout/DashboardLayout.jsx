import React, { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import Sidebar from '../components/sidebar/Sidebar'
import Header from '../components/header/Header'

const breadcrumbMap = {
  '/dashboard/manage/email': ['Home', 'Manage', 'Email/Password'],
  '/dashboard/admin-user-list': ['Home', 'Manage', 'Admin users'],
  '/dashboard/manage/admin-users': ['Home', 'Manage', 'Admin users'],
  '/dashboard/manage/admin-users/add-user': ['Home', 'Manage', 'Add admin user'],
  '/dashboard/add-user': ['Home', 'Manage', 'Add admin user'],
  '/dashboard/edit-user': ['Home', 'Manage', 'Edit user'],
  '/dashboard/manage/plan': ['Home', 'Manage', 'Plan'],
  '/dashboard/manage/team-users': ['Home', 'Manage', 'Team users'],
  '/dashboard/manage/team-route-history': ['Home', 'Manage', 'Team driver route history'],
  '/dashboard/security/delete-account': ['Home', 'Security', 'Delete account'],
  '/dashboard/security/data-protection': ['Home', 'Security', 'Data protection'],
  '/dashboard/support/contact': ['Home', 'Support', 'Contact Us'],
  '/dashboard/support/submit-ticket': ['Home', 'Support', 'Submit a support ticket'],
  '/dashboard/support/resources': ['Home', 'Support', 'Resources'],
  '/dashboard/legal/privacy-policy': ['Home', 'Legal', 'Privacy Policy'],
  '/dashboard/legal/terms-of-use': ['Home', 'Legal', 'Terms of Use'],
  '/dashboard/legal/disclaimer': ['Home', 'Legal', 'Disclaimer']
}

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const breadcrumb = location.pathname.startsWith('/dashboard/manage/admin-users/edit/')
    ? ['Home', 'Manage', 'Edit admin user']
    : breadcrumbMap[location.pathname] || ['Home']

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Full-width header row */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center bg-gradient-to-b from-[#1B235E] to-[#190F0C] md:h-[72px]" style={{ background: 'linear-gradient(180deg, #1B235E 0%, #190F0C 100%)' }}>
        <Header onMenuClick={handleMenuClick} />
      </header>

      <div className="fixed inset-x-0 top-16 z-30 flex h-10 items-center bg-[#ff823d] px-9 text-base font-medium text-white md:top-[72px] md:h-11">
        <div className="w-[calc(100%-2.5rem)] max-w-[calc(100vw-20rem)]">
          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1
            const isHome = item === 'Home'
            const isDashboardRoute = location.pathname === '/dashboard'

            return (
              <React.Fragment key={`${item}-${index}`}>
                {index > 0 && <span className="mx-2">&gt;</span>}

                {isHome ? (
                  <Link
                    to="/dashboard"
                    className={isDashboardRoute ? 'text-white hover:opacity-90' : isLast ? 'text-black' : 'text-white hover:opacity-90'}
                  >
                    {item}
                  </Link>
                ) : isLast ? (
                  <span className="text-black">{item}</span>
                ) : (
                  <span className="text-white">{item}</span>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Sidebar and page content row */}
      <div className="min-h-screen pt-[92px] md:pl-60 md:pt-[100px]">
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-[92px] z-30 bg-black/40 md:hidden"
            onClick={handleCloseSidebar}
          />
        )}

        <aside
          className={`fixed top-[92px] bottom-0 left-0 z-20 w-60 transform overflow-y-auto border-r border-gray-200 bg-white px-4 py-5 transition-transform duration-300 ease-in-out md:top-[100px] md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
        </aside>

        <main className="min-h-[calc(100vh-92px)] min-w-0 overflow-x-hidden p-4 md:min-h-[calc(100vh-100px)] md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout