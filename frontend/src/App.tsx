import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import Navbar from './components/Layout/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import VideoPage from './pages/VideoPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminQuestionDetail from './pages/admin/AdminQuestionDetail';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminModuleEditor from './pages/admin/AdminModuleEditor';
import SignupPage from './pages/SignupPage';
import InvitePage from './pages/InvitePage';
import OrgSettingsPage from './pages/admin/OrgSettingsPage';
import LandingPage from './pages/LandingPage';
import MeetingsPage from './pages/MeetingsPage';
import AdminMeetingsPage from './pages/admin/AdminMeetingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import ProfilePage from './pages/ProfilePage';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { token, user } = useAuthStore();
  if (!token) return <LandingPage />;
  return <Navigate to={user?.role === 'employee' ? '/modules' : '/admin'} replace />;
}

function RequireManager({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  if (!user || user.role === 'employee') return <Navigate to="/modules" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          <Route path="/" element={<HomeRoute />} />

          <Route
            path="/modules"
            element={
              <RequireAuth>
                <AppLayout>
                  <ModulesPage />
                </AppLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/modules/:moduleId"
            element={
              <RequireAuth>
                <AppLayout>
                  <ModuleDetailPage />
                </AppLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/meetings"
            element={
              <RequireAuth>
                <AppLayout>
                  <MeetingsPage />
                </AppLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/video/:videoId"
            element={
              <RequireAuth>
                <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
                  <Navbar />
                  <VideoPage />
                </div>
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireManager>
                  <AdminLayout />
                </RequireManager>
              </RequireAuth>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="courses/new" element={<AdminModuleEditor />} />
            <Route path="courses/:moduleId/edit" element={<AdminModuleEditor />} />
            <Route path="questions" element={<AdminQuestionsPage />} />
            <Route path="questions/:questionId" element={<AdminQuestionDetail />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="meetings" element={<AdminMeetingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<OrgSettingsPage />} />
          </Route>

          <Route path="*" element={<HomeRoute />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
