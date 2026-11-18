/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/AuthContext";
import { AreaGate } from "./components/shared/AreaGate";
import { DashboardShell } from "./components/shared/DashboardShell";
import { MobileShell } from "./components/mobile/MobileShell";
import { BrandLogo } from "./components/shared/Brand";

import { LandingPage } from "./pages/LandingPage";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  WorkspaceLoginPage,
} from "./pages/AuthPages";
import {
  MobileSplashPage,
  MobileWelcomePage,
  MobileLanguagePage,
  MobileInterestsPage,
  MobileAuthStepPage,
} from "./pages/OnboardingPages";

import {
  MobileHomePage,
  MobileLivePage,
  MobileProgramsPage,
  MobileProgramDetailPage,
  MobileEpisodesPage,
  MobileEpisodeDetailPage,
} from "./pages/mobile/MobileFeedPages";
import {
  MobileVideosPage,
  MobileVideoDetailPage,
  MobileNewsPage,
  MobileNewsDetailPage,
  MobilePresentersPage,
  MobilePresenterDetailPage,
  MobileSchedulePage,
  MobileSearchPage,
  MobileNotificationsPage,
} from "./pages/mobile/MobileMediaPages";
import {
  MobileLibraryPage,
  MobileFavoritesPage,
  MobileFollowingPage,
  MobileHistoryPage,
  MobileDownloadsPage,
  MobilePlaylistsPage,
  MobileProfilePage,
  MobileSettingsPage,
  MobileSettingsPlaybackPage,
  MobileSettingsNotificationsPage,
  MobileSettingsLanguagePage,
  MobileSettingsPrivacyPage,
  MobileAboutPage,
} from "./pages/mobile/MobileLibraryPages";

import {
  StudioDashboardPage,
  StudioLivePage,
  StudioEmergencyPage,
  StudioStreamsPage,
  StudioSchedulePage,
} from "./pages/studio/StudioLivePages";
import {
  StudioProgramsPage,
  StudioEpisodesPage,
  StudioEpisodeUploadPage,
  StudioRecordingsPage,
  StudioVideosPage,
  StudioVideoUploadPage,
  StudioNewsPage,
  StudioNewsCreatePage,
  StudioPresentersPage,
  StudioMediaPage,
} from "./pages/studio/StudioContentPages";
import {
  StudioAiPage,
  StudioNotificationsPage,
  StudioAnalyticsPage,
  StudioSettingsPage,
} from "./pages/studio/StudioOpsPages";

import {
  AdminDashboardPage,
  AdminLivePage,
  AdminStreamsPage,
  AdminBroadcastHistoryPage,
} from "./pages/admin/AdminDashboardPages";
import {
  AdminSchedulesPage,
  AdminCategoriesPage,
  AdminProgramsPage,
  AdminEpisodesPage,
  AdminVideosPage,
  AdminNewsPage,
  AdminPresentersPage,
  AdminMediaPage,
  AdminOrganizationsPage,
  AdminStationsPage,
} from "./pages/admin/AdminCatalogPages";
import {
  AdminAiPage,
  AdminUsersPage,
  AdminRolesPage,
  AdminNotificationsPage,
  AdminAdvertisementsPage,
  AdminAnalyticsPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
} from "./pages/admin/AdminGovernancePages";

function StudioLayout() {
  return (
    <AreaGate area="studio">
      <DashboardShell area="studio">
        <Outlet />
      </DashboardShell>
    </AreaGate>
  );
}

function AdminLayout() {
  return (
    <AreaGate area="admin">
      <DashboardShell area="admin">
        <Outlet />
      </DashboardShell>
    </AreaGate>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6F7] px-4 text-center">
      <BrandLogo size={56} />
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#047422]">
        404 · NOT FOUND
      </p>
      <h1 className="mt-1 text-[24px] font-extrabold tracking-tight text-[#050505]">
        Page not found
      </h1>
      <p className="mt-1.5 max-w-sm text-[13px] text-[#6B7280]">
        The Radio Hargeysa page you requested does not exist or has moved.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-[#047422] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#035A1B]"
        >
          Back to home
        </Link>
        <Link
          to="/mobile/home"
          className="rounded-xl border border-[#E7E9EC] bg-white px-4 py-2 text-[12.5px] font-bold text-[#050505] hover:bg-[#FAFBFC]"
        >
          Open Listener App
        </Link>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class DefaultCatchBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error?.message || "Unexpected error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F6F7] px-4 text-center">
          <BrandLogo size={52} />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C40D0F]">
            Application Error
          </p>
          <h1 className="mt-1 text-[20px] font-extrabold text-[#050505]">
            Something went wrong
          </h1>
          <p className="mt-1.5 max-w-md text-[12.5px] text-[#6B7280]">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.href = "/";
            }}
            className="mt-5 rounded-xl bg-[#047422] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#035A1B]"
          >
            Reload platform
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <DefaultCatchBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <Routes>
            {/* Public & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/admin_/login"
              element={<WorkspaceLoginPage area="admin" />}
            />
            <Route
              path="/admin/login"
              element={<WorkspaceLoginPage area="admin" />}
            />
            <Route
              path="/studio_/login"
              element={<WorkspaceLoginPage area="studio" />}
            />
            <Route
              path="/studio/login"
              element={<WorkspaceLoginPage area="studio" />}
            />

            {/* Listener Onboarding (Canonical + Legacy aliases) */}
            <Route path="/mobile/splash" element={<MobileSplashPage />} />
            <Route path="/mobile/welcome" element={<MobileWelcomePage />} />
            <Route path="/mobile/language" element={<MobileLanguagePage />} />
            <Route path="/mobile/interests" element={<MobileInterestsPage />} />
            <Route path="/mobile/auth" element={<MobileAuthStepPage />} />
            <Route path="/mobile_/splash" element={<MobileSplashPage />} />
            <Route path="/mobile_/welcome" element={<MobileWelcomePage />} />
            <Route path="/mobile_/language" element={<MobileLanguagePage />} />
            <Route path="/mobile_/interests" element={<MobileInterestsPage />} />
            <Route path="/mobile_/auth" element={<MobileAuthStepPage />} />

            {/* Listener Mobile Shell */}
            <Route path="/mobile" element={<MobileShell />}>
              <Route index element={<Navigate to="/mobile/home" replace />} />
              <Route path="home" element={<MobileHomePage />} />
              <Route path="live" element={<MobileLivePage />} />
              <Route path="programs" element={<MobileProgramsPage />} />
              <Route
                path="programs/:programId"
                element={<MobileProgramDetailPage />}
              />
              <Route path="episodes" element={<MobileEpisodesPage />} />
              <Route
                path="episodes/:episodeId"
                element={<MobileEpisodeDetailPage />}
              />
              <Route path="videos" element={<MobileVideosPage />} />
              <Route
                path="videos/:videoId"
                element={<MobileVideoDetailPage />}
              />
              <Route path="news" element={<MobileNewsPage />} />
              <Route path="news/:articleId" element={<MobileNewsDetailPage />} />
              <Route path="presenters" element={<MobilePresentersPage />} />
              <Route
                path="presenters/:presenterId"
                element={<MobilePresenterDetailPage />}
              />
              <Route path="schedule" element={<MobileSchedulePage />} />
              <Route path="search" element={<MobileSearchPage />} />
              <Route path="notifications" element={<MobileNotificationsPage />} />
              <Route path="library" element={<MobileLibraryPage />} />
              <Route
                path="library/favorites"
                element={<MobileFavoritesPage />}
              />
              <Route
                path="library/following"
                element={<MobileFollowingPage />}
              />
              <Route path="library/history" element={<MobileHistoryPage />} />
              <Route
                path="library/downloads"
                element={<MobileDownloadsPage />}
              />
              <Route
                path="library/playlists"
                element={<MobilePlaylistsPage />}
              />
              <Route path="profile" element={<MobileProfilePage />} />
              <Route path="settings" element={<MobileSettingsPage />} />
              <Route
                path="settings/playback"
                element={<MobileSettingsPlaybackPage />}
              />
              <Route
                path="settings/notifications"
                element={<MobileSettingsNotificationsPage />}
              />
              <Route
                path="settings/language"
                element={<MobileSettingsLanguagePage />}
              />
              <Route
                path="settings/privacy"
                element={<MobileSettingsPrivacyPage />}
              />
              <Route path="about" element={<MobileAboutPage />} />
              <Route
                path="settings/about"
                element={<Navigate to="/mobile/about" replace />}
              />
            </Route>

            {/* Studio Dashboard */}
            <Route path="/studio" element={<StudioLayout />}>
              <Route
                index
                element={<Navigate to="/studio/dashboard" replace />}
              />
              <Route path="dashboard" element={<StudioDashboardPage />} />
              <Route path="live" element={<StudioLivePage />} />
              <Route path="live/emergency" element={<StudioEmergencyPage />} />
              <Route path="streams" element={<StudioStreamsPage />} />
              <Route path="schedule" element={<StudioSchedulePage />} />
              <Route path="programs" element={<StudioProgramsPage />} />
              <Route path="episodes" element={<StudioEpisodesPage />} />
              <Route
                path="episodes/upload"
                element={<StudioEpisodeUploadPage />}
              />
              <Route path="recordings" element={<StudioRecordingsPage />} />
              <Route path="videos" element={<StudioVideosPage />} />
              <Route path="videos/upload" element={<StudioVideoUploadPage />} />
              <Route path="news" element={<StudioNewsPage />} />
              <Route path="news/create" element={<StudioNewsCreatePage />} />
              <Route path="presenters" element={<StudioPresentersPage />} />
              <Route path="media" element={<StudioMediaPage />} />
              <Route path="ai" element={<StudioAiPage />} />
              <Route
                path="notifications"
                element={<StudioNotificationsPage />}
              />
              <Route path="analytics" element={<StudioAnalyticsPage />} />
              <Route path="settings" element={<StudioSettingsPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="live" element={<AdminLivePage />} />
              <Route path="streams" element={<AdminStreamsPage />} />
              <Route
                path="broadcast-history"
                element={<AdminBroadcastHistoryPage />}
              />
              <Route
                path="Broadcast History"
                element={<Navigate to="/admin/broadcast-history" replace />}
              />
              <Route
                path="history"
                element={<Navigate to="/admin/broadcast-history" replace />}
              />
              <Route path="schedules" element={<AdminSchedulesPage />} />
              <Route path="category" element={<AdminCategoriesPage />} />
              <Route
                path="categories"
                element={<Navigate to="/admin/category" replace />}
              />
              <Route path="programs" element={<AdminProgramsPage />} />
              <Route path="episodes" element={<AdminEpisodesPage />} />
              <Route path="videos" element={<AdminVideosPage />} />
              <Route path="news" element={<AdminNewsPage />} />
              <Route path="presenters" element={<AdminPresentersPage />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="ai" element={<AdminAiPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route
                path="notifications"
                element={<AdminNotificationsPage />}
              />
              <Route
                path="organizations"
                element={<AdminOrganizationsPage />}
              />
              <Route path="stations" element={<AdminStationsPage />} />
              <Route
                path="advertisements"
                element={<AdminAdvertisementsPage />}
              />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DefaultCatchBoundary>
  );
}
