import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { useBrandColor } from './hooks/useBrandColor';
import Navbar from './components/Layout/Navbar';
import BottomNav from './components/Layout/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import NestAssistant from './components/AI/NestAssistant';
import OnboardingTour from './components/Onboarding/OnboardingTour';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ModulesPage = lazy(() => import('./pages/ModulesPage'));
const ModuleDetailPage = lazy(() => import('./pages/ModuleDetailPage'));
const VideoPage = lazy(() => import('./pages/VideoPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'));
const AdminQuestionDetail = lazy(() => import('./pages/admin/AdminQuestionDetail'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminCoursesPage = lazy(() => import('./pages/admin/AdminCoursesPage'));
const AdminModuleEditor = lazy(() => import('./pages/admin/AdminModuleEditor'));
const OnboardingWizard = lazy(() => import('./pages/admin/OnboardingWizard'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const OrgSettingsPage = lazy(() => import('./pages/admin/OrgSettingsPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const AdminMeetingsPage = lazy(() => import('./pages/admin/AdminMeetingsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminPeoplePage = lazy(() => import('./pages/admin/AdminPeoplePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage'));
const AssignmentWorkspace = lazy(() => import('./pages/AssignmentWorkspace'));
const GroupMergedView = lazy(() => import('./pages/GroupMergedView'));
const AdminAssignmentsPage = lazy(() => import('./pages/admin/AdminAssignmentsPage'));
const AdminAssignmentEditor = lazy(() => import('./pages/admin/AdminAssignmentEditor'));
const AdminAssignmentDetail = lazy(() => import('./pages/admin/AdminAssignmentDetail'));
const AdminSubmissionReview = lazy(() => import('./pages/admin/AdminSubmissionReview'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PaySubmitPage = lazy(() => import('./pages/PaySubmitPage'));
const PayStatusPage = lazy(() => import('./pages/PayStatusPage'));
const AdminPaymentsPage = lazy(() => import('./pages/admin/AdminPaymentsPage'));
const PitchDeck = lazy(() => import('./pages/PitchDeck'));
const OnePagerPage = lazy(() => import('./pages/OnePagerPage'));
const BusinessPlanPage = lazy(() => import('./pages/BusinessPlanPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const MediaKitPage = lazy(() => import('./pages/MediaKitPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  // Check `user` (persisted to localStorage) rather than `token` (in-memory only).
  // The httpOnly cookie is the real auth — if it's expired, the first API call
  // returns 401 and the axios interceptor clears the user and redirects to login.
  const { user } = useAuthStore();
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

function HomeRoute() {
  const { user } = useAuthStore();
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === 'learner' ? '/modules' : '/admin'} replace />;
}

function RequireManager({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  if (!user || user.role === 'learner') return <Navigate to="/modules" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 font-sans">
      <Navbar />
      <main className="pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}

function BrandColorApplier() {
  useBrandColor();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BrandColorApplier />
        <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950" />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route path="/certificate/:certId" element={<CertificatePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/pitch" element={<PitchDeck />} />
          <Route path="/one-pager" element={<OnePagerPage />} />
          <Route path="/business-plan" element={<BusinessPlanPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/media-kit" element={<MediaKitPage />} />
          <Route path="/pay/submit" element={<RequireAuth><PaySubmitPage /></RequireAuth>} />
          <Route path="/pay/status" element={<RequireAuth><PayStatusPage /></RequireAuth>} />

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
            path="/assignments"
            element={
              <RequireAuth>
                <AppLayout>
                  <AssignmentsPage />
                </AppLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/assignments/:assignmentId/work"
            element={
              <RequireAuth>
                <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 font-sans flex flex-col">
                  <Navbar />
                  <AssignmentWorkspace />
                </div>
              </RequireAuth>
            }
          />

          <Route
            path="/assignments/:assignmentId/merged"
            element={
              <RequireAuth>
                <AppLayout>
                  <GroupMergedView />
                </AppLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/video/:videoId"
            element={
              <RequireAuth>
                <div className="min-h-screen bg-[#FAF7F2] font-sans flex flex-col">
                  <Navbar />
                  <VideoPage />
                </div>
              </RequireAuth>
            }
          />

          <Route
            path="/lesson/:lessonId"
            element={
              <RequireAuth>
                <div className="min-h-screen font-sans flex flex-col" style={{ background: '#0b0c0f' }}>
                  <Navbar />
                  <LessonPage />
                </div>
              </RequireAuth>
            }
          />

          <Route
            path="/admin/onboarding"
            element={
              <RequireAuth>
                <RequireManager>
                  <OnboardingWizard />
                </RequireManager>
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
            <Route path="people" element={<AdminPeoplePage />} />
            <Route path="meetings" element={<AdminMeetingsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="settings" element={<OrgSettingsPage />} />
            <Route path="assignments" element={<AdminAssignmentsPage />} />
            <Route path="assignments/new" element={<AdminAssignmentEditor />} />
            <Route path="assignments/:assignmentId" element={<AdminAssignmentDetail />} />
            <Route path="assignments/:assignmentId/edit" element={<AdminAssignmentEditor />} />
            <Route path="assignments/:assignmentId/submissions/:submissionId/review" element={<AdminSubmissionReview />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
          </Route>

          <Route path="*" element={<HomeRoute />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>

      <NestAssistant />
      <OnboardingTour />

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
