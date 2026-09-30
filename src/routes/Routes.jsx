import { createBrowserRouter } from 'react-router'
import AuthLayout from '../layout/AuthLayout'
import ErrorPage from '../pages/ErrorPage'
import Login from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import DashboardLayout from '../layout/DashboardLayout'
import Dashboard from '../pages/admin user/Dashboard'
import AdminUser from '../pages/manage/admin user/AdminUser'
import AddAdminUser from '../pages/manage/admin user/AddAdminUser'
import Email from '../pages/manage/email/Email'
import EditAdminUser from '../pages/manage/admin user/EditAdminUser'
import Plan from '../pages/manage/plan/Plan'
import DeleteAccount from '../pages/security/delete account/DeleteAccount'
import DataProtection from '../pages/security/data protection/DataProtection'
import ContactSupport from '../pages/support/contact support/ContactSupport'
import SubmitTicket from '../pages/support/submit support ticket/SubmitTicket'
import Resources from '../pages/support/resources/Resources'
import TeamUser from '../pages/manage/team user/TeamUser'
import RouteHistory from '../pages/manage/route history/RouteHistory'
import CreateRoute from '../pages/manage/route history/CreateRoute'
import EditRoute from '../pages/manage/route history/EditRoute'
import PrivacyPolicy from '../pages/legal/privacy policy/PrivacyPolicy'
import TermsOfUse from '../pages/legal/terms of use/TermsOfUse'
import Disclaimer from '../pages/legal/disclaimer/Disclaimer'
import VerifyOtp from '../pages/auth/VerifyOtp'
import RequirePermission from './RequirePermission'

const withPermission = (permission, element) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
)

const withAnyPermission = (anyPermission, element) => (
  <RequirePermission anyPermission={anyPermission}>{element}</RequirePermission>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Login /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'otp', element: <VerifyOtp /> },
      { path: 'verify-otp', element: <VerifyOtp /> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'manage/email', element: withPermission('manage.email_password', <Email />) },
      { path: 'manage/admin-users', element: withPermission('manage.admin_users', <AdminUser />) },
      { path: 'manage/admin-users/add-user', element: withPermission('manage.admin_users', <AddAdminUser />) },
      { path: 'manage/admin-users/edit/:id', element: withPermission('manage.admin_users', <EditAdminUser />) },
      { path: 'manage/team-users', element: withPermission('manage.team_users', <TeamUser />) },
      {
        path: 'manage/team-route-history',
        element: withAnyPermission(['manage.route_history.team', 'manage.route_history.my'], <RouteHistory />),
      },
      {
        path: 'manage/team-route-history/create',
        element: withAnyPermission(['manage.route_history.team', 'manage.route_history.my'], <CreateRoute />),
      },
      {
        path: 'manage/team-route-history/edit/:routeId',
        element: withAnyPermission(['manage.route_history.team', 'manage.route_history.my'], <EditRoute />),
      },
      { path: 'manage/plan', element: withPermission('manage.plan', <Plan />) },
      { path: 'security/delete-account', element: withPermission('security.delete_account', <DeleteAccount />) },
      { path: 'security/data-protection', element: withPermission('security.data_protection', <DataProtection />) },
      { path: 'support/contact', element: withPermission('support.contact_support', <ContactSupport />) },
      { path: 'support/submit-ticket', element: withPermission('support.submit_ticket', <SubmitTicket />) },
      { path: 'support/resources', element: withPermission('support.resources', <Resources />) },
      { path: 'legal/privacy-policy', element: withPermission('legal.privacy_policy', <PrivacyPolicy />) },
      { path: 'legal/terms-of-use', element: withPermission('legal.terms_of_use', <TermsOfUse />) },
      { path: 'legal/disclaimer', element: withPermission('legal.disclaimer', <Disclaimer />) },
    ],
  },
])