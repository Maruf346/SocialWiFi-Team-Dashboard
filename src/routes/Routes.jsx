import { createBrowserRouter } from "react-router";
import AuthLayout from "../layout/AuthLayout";
import ErrorPage from "../pages/ErrorPage";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Mfa from "../components/Mfa";
import DashboardLayout from "../layout/DashboardLayout";
import Dashboard from "../pages/admin user/Dashboard";
//manage section
import AdminUser from "../pages/manage/admin user/AdminUser";
import AddAdminUser from "../pages/manage/admin user/AddAdminUser";
import Email from "../pages/manage/email/Email";
import EditAdminUser from "../pages/manage/admin user/EditAdminUser";
import Plan from "../pages/manage/plan/Plan";
// security section
import DeleteAccount from "../pages/security/delete account/DeleteAccount";
import DataProtection from "../pages/security/data protection/DataProtection";
// support section
import ContactSupport from "../pages/support/contact support/ContactSupport";
import SubmitTicket from "../pages/support/submit support ticket/SubmitTicket";
import Resources from "../pages/support/resources/Resources";
import TeamUser from "../pages/manage/team user/TeamUser";
import RouteHistory from "../pages/manage/route history/RouteHistory";
//legal section
import PrivacyPolicy from "../pages/legal/privacy policy/PrivacyPolicy";
import TermsOfUse from "../pages/legal/terms of use/TermsOfUse";
import Disclaimer from "../pages/legal/disclaimer/Disclaimer";
import VerifyOtp from "../pages/auth/VerifyOtp";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Login /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "otp", element: <Mfa /> },
      { path: "verify-otp", element: <VerifyOtp /> },
      { path: "reset-password", element: <ResetPassword /> },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "manage/email", element: <Email /> },
      { path: "manage/admin-users", element: <AdminUser /> },
      { path: "manage/admin-users/add-user", element: <AddAdminUser /> },
      { path: "manage/admin-users/edit/:id", element: <EditAdminUser /> },
      { path: "manage/team-users", element: <TeamUser /> },
      { path: "manage/team-route-history", element: <RouteHistory /> },
      { path: "manage/plan", element: <Plan /> },
      // { path: "edit-user/:id", element: <EditAdminUser /> },
      // security routes
      { path: "security/delete-account", element: <DeleteAccount /> },
      { path: "security/data-protection", element: <DataProtection /> },
      // support routes
      { path: "support/contact", element: <ContactSupport /> },
      { path: "support/submit-ticket", element: <SubmitTicket /> },
      { path: "support/resources", element: <Resources /> },
      // legal routes
      { path: "legal/privacy-policy", element: <PrivacyPolicy /> },
      { path: "legal/terms-of-use", element: <TermsOfUse /> },
      { path: "legal/disclaimer", element: <Disclaimer /> },
    ],
  },
]);
