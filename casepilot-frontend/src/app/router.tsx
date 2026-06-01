import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MarketingLayout } from '../layouts/MarketingLayout';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { HomePage } from '../features/cases/pages/HomePage';
import { LoginPage } from '../features/cases/pages/LoginPage';
import { RegisterPage } from '../features/cases/pages/RegisterPage';
import { VerifyCodePage } from '../features/cases/pages/VerifyCodePage';
import { ForgotPasswordPage } from '../features/cases/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/cases/pages/ResetPasswordPage';
import { DashboardHome } from '../features/cases/pages/DashboardHome';
import { CalendarPage } from '../features/cases/pages/CalendarPage';
import { AIAssistantPage } from '../features/cases/pages/AIAssistantPage';
import { ProfilePage } from '../features/cases/pages/ProfilePage';
import { CasesPage } from '../features/cases/pages/CasesPage';
import { CaseDetailPage } from '../features/cases/pages/CaseDetailPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';
import { AdminAuditLogsPage } from '../features/admin/pages/AdminAuditLogsPage';
import { AdminWatchlistPage } from '../features/admin/pages/AdminWatchlistPage';
import { RoleRedirect } from '../features/auth/RoleRedirect';

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <MarketingLayout />,
    children: [{ index: true, element: <HomePage /> }]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/verify-code',
    element: <VerifyCodePage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  },
  {
    path: '/app',
    element: <WorkspaceLayout />,
    children: [
      // Smart redirect: admin → admin panel, lawyer → dosare
      { index: true, element: <RoleRedirect /> },
      // Lawyer pages
      { path: 'dashboard', element: <DashboardHome /> },
      { path: 'dosare', element: <CasesPage /> },
      { path: 'dosare/:caseId', element: <CaseDetailPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'asistent-ai', element: <AIAssistantPage /> },
      { path: 'profil', element: <ProfilePage /> },
      // Admin pages
      { path: 'admin/utilizatori', element: <AdminUsersPage /> },
      { path: 'admin/audit', element: <AdminAuditLogsPage /> },
      { path: 'admin/supraveghere', element: <AdminWatchlistPage /> },
    ]
  }
]);
