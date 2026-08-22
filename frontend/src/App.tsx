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
import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode, ComponentType } from 'react';

// Lazy import that survives slow/flaky connections and stale chunks after a
// deploy. If a chunk fails to load, retry once after a short delay; if it still
// fails (usually an old hashed URL that no longer exists post-deploy), force a
// one-time reload so the user gets the fresh index instead of a blank screen.
function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      // Retry once — covers a transient network drop on a slow connection.
      try {
        await new Promise((r) => setTimeout(r, 600));
        return await factory();
      } catch (err2) {
        const KEY = 'nest_chunk_reloaded';
        try {
          if (!sessionStorage.getItem(KEY)) {
            sessionStorage.setItem(KEY, '1');
            window.location.reload();
            // Return a never-resolving promise; the reload takes over.
            return await new Promise<{ default: T }>(() => {});
          }
        } catch { /* sessionStorage blocked — fall through to the error */ }
        throw err2;
      }
    }
  });
}

const LoginPage = lazyWithReload(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazyWithReload(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithReload(() => import('./pages/ResetPasswordPage'));
const ModulesPage = lazyWithReload(() => import('./pages/ModulesPage'));
const ModuleDetailPage = lazyWithReload(() => import('./pages/ModuleDetailPage'));
const VideoPage = lazyWithReload(() => import('./pages/VideoPage'));
const LessonPage = lazyWithReload(() => import('./pages/LessonPage'));
const AdminLayout = lazyWithReload(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazyWithReload(() => import('./pages/admin/AdminDashboard'));
const AdminQuestionsPage = lazyWithReload(() => import('./pages/admin/AdminQuestionsPage'));
const AdminQuestionDetail = lazyWithReload(() => import('./pages/admin/AdminQuestionDetail'));
const AdminAnalyticsPage = lazyWithReload(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminCoursesPage = lazyWithReload(() => import('./pages/admin/AdminCoursesPage'));
const AdminModuleEditor = lazyWithReload(() => import('./pages/admin/AdminModuleEditor'));
const OnboardingWizard = lazyWithReload(() => import('./pages/admin/OnboardingWizard'));
const SignupPage = lazyWithReload(() => import('./pages/SignupPage'));
const InvitePage = lazyWithReload(() => import('./pages/InvitePage'));
const JoinPage = lazyWithReload(() => import('./pages/JoinPage'));
const OrgSettingsPage = lazyWithReload(() => import('./pages/admin/OrgSettingsPage'));
const LandingPage = lazyWithReload(() => import('./pages/LandingPage'));
const ExplorePage = lazyWithReload(() => import('./pages/ExplorePage'));
const MeetingsPage = lazyWithReload(() => import('./pages/MeetingsPage'));
const AdminMeetingsPage = lazyWithReload(() => import('./pages/admin/AdminMeetingsPage'));
const AdminPeoplePage = lazyWithReload(() => import('./pages/admin/AdminPeoplePage'));
const ProfilePage = lazyWithReload(() => import('./pages/ProfilePage'));
const CertificatePage = lazyWithReload(() => import('./pages/CertificatePage'));
const AssignmentsPage = lazyWithReload(() => import('./pages/AssignmentsPage'));
const AssignmentWorkspace = lazyWithReload(() => import('./pages/AssignmentWorkspace'));
const GroupMergedView = lazyWithReload(() => import('./pages/GroupMergedView'));
const AdminAssignmentsPage = lazyWithReload(() => import('./pages/admin/AdminAssignmentsPage'));
const AdminAssignmentEditor = lazyWithReload(() => import('./pages/admin/AdminAssignmentEditor'));
const AdminAssignmentDetail = lazyWithReload(() => import('./pages/admin/AdminAssignmentDetail'));
const AdminSubmissionReview = lazyWithReload(() => import('./pages/admin/AdminSubmissionReview'));
const PricingPage = lazyWithReload(() => import('./pages/PricingPage'));
const CareersPage = lazyWithReload(() => import('./pages/CareersPage'));
const PaySubmitPage = lazyWithReload(() => import('./pages/PaySubmitPage'));
const PayStatusPage = lazyWithReload(() => import('./pages/PayStatusPage'));
const AdminPaymentsPage = lazyWithReload(() => import('./pages/admin/AdminPaymentsPage'));
const PitchDeck = lazyWithReload(() => import('./pages/PitchDeck'));
const OnePagerPage = lazyWithReload(() => import('./pages/OnePagerPage'));
const BusinessPlanPage = lazyWithReload(() => import('./pages/BusinessPlanPage'));
const TermsPage = lazyWithReload(() => import('./pages/TermsPage'));
const PrivacyPage = lazyWithReload(() => import('./pages/PrivacyPage'));
const MediaKitPage = lazyWithReload(() => import('./pages/MediaKitPage'));
const VerifyEmailPage = lazyWithReload(() => import('./pages/VerifyEmailPage'));

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
    <div className="min-h-[100dvh] bg-white dark:bg-slate-950 font-sans">
      <Navbar />
      <main className="md:pb-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        <style>{`@media (min-width: 768px) { main { padding-bottom: 0 !important; } }`}</style>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function BrandColorApplier() {
  useBrandColor();
  return null;
}

// Branded loader shown while a page's code chunk downloads. Replaces the old
// blank-white div, which on a slow/failed load looked like a broken page.
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg, #F6F4FD)',
      }}
    >
      <div
        aria-label="Loading"
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid rgba(109,74,224,0.18)',
          borderTopColor: '#6D4AE0',
          animation: 'nestspin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes nestspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Safety net: whenever the route changes, make sure page scrolling is unlocked.
// Modals/players lock document.body.overflow while open; if one ever fails to
// clean up (e.g. unmounted by a navigation instead of a close handler), the whole
// app would be stuck unscrollable. Resetting on every navigation guarantees a
// fresh page can always scroll.
function ScrollUnlocker() {
  const location = useLocation();
  useEffect(() => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [location.pathname]);
  return null;
}

export default function App() {
  // A successful mount means the last (possibly reloaded) load worked — reset
  // the one-time chunk-reload budget so a future stale chunk can reload again.
  useEffect(() => {
    try { sessionStorage.removeItem('nest_chunk_reloaded'); } catch { /* ignore */ }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <BrandColorApplier />
        <ScrollUnlocker />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route path="/certificate/:certId" element={<CertificatePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/explore" element={<ExplorePage />} />
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
                <div className="min-h-[100dvh] bg-[#FAF7F2] dark:bg-slate-950 font-sans flex flex-col">
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
                <div className="min-h-[100dvh] bg-[#FAF7F2] font-sans flex flex-col">
                  <div className="hidden lg:block"><Navbar /></div>
                  <VideoPage />
                </div>
              </RequireAuth>
            }
          />

          <Route
            path="/lesson/:lessonId"
            element={
              <RequireAuth>
                <div className="min-h-[100dvh] font-sans flex flex-col" style={{ background: 'var(--c-bg)' }}>
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
            <Route path="users" element={<Navigate to="/admin/people" replace />} />
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
