import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoginPage } from "@/pages/Login";
import { DashboardHome } from "@/pages/DashboardHome";
import { UserSearch } from "@/pages/UserSearch";
import { UserProfile } from "@/pages/UserProfile";
import { WalletHistory } from "@/pages/WalletHistory";
import { StripeLookup } from "@/pages/StripeLookup";
import { JobHistory } from "@/pages/JobHistory";
import { UserCreations } from "@/pages/UserCreations";
import { UserSignups } from "@/pages/UserSignups";
import { SubscriberSignups } from "@/pages/SubscriberSignups";
import { ExploreMedia } from "@/pages/ExploreMedia";
import { Impersonation } from "@/pages/Impersonation";
import { StaffAuditLogs } from "@/pages/StaffAuditLogs";
import { SendPager } from "@/pages/SendPager";
import { FeatureFlags } from "@/pages/FeatureFlags";
import { UserEmailChanges } from "@/pages/UserEmailChanges";
import { ReferralsAnalytics } from "@/pages/ReferralsAnalytics";
import { UserReferrals } from "@/pages/UserReferrals";
import { JobInfo } from "@/pages/JobInfo";
import { JobTokenSearch } from "@/pages/JobTokenSearch";
import { DebugLogs } from "@/pages/DebugLogs";
import { DebugLogsSearch } from "@/pages/DebugLogsSearch";
import { SpendEvents } from "@/pages/SpendEvents";
import { UserSpendSummary } from "@/pages/UserSpendSummary";
import { UserSpendHistory } from "@/pages/UserSpendHistory";
import { NotFoundPage } from "@/pages/NotFound";
import { Spinner } from "./components/ui/spinner";
import { ThemeProvider } from "@/components/theme-provider";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="size-12 opacity-60" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={redirectTo} replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={user ? <DashboardLayout /> : <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />}
      >
        <Route index element={<DashboardHome />} />
        <Route path="user/search" element={<UserSearch />} />
        <Route path="user/profile/:username" element={<UserProfile />} />
        <Route path="user/profile/:username/wallet" element={<WalletHistory />} />
        <Route path="user/profile/:username/jobs" element={<JobHistory />} />
        <Route path="user/profile/:username/creations" element={<UserCreations />} />
        <Route path="user/profile/:username/referrals" element={<UserReferrals />} />
        <Route path="user/spend-summary/:username" element={<UserSpendSummary />} />
        <Route path="user/spend-history/:username" element={<UserSpendHistory />} />
        <Route path="stripe-lookup" element={<StripeLookup />} />
        <Route path="user-signups" element={<UserSignups />} />
        <Route path="subscriber-signups" element={<SubscriberSignups />} />
        <Route path="spend-events" element={<SpendEvents />} />
        <Route path="impersonation" element={<Impersonation />} />
        <Route path="staff-audit-logs" element={<StaffAuditLogs />} />
        <Route path="send-pager" element={<SendPager />} />
        <Route path="feature-flags" element={<FeatureFlags />} />
        <Route path="email-changes" element={<UserEmailChanges />} />
        <Route path="referrals" element={<ReferralsAnalytics />} />
        <Route path="explore/media" element={<ExploreMedia />} />
        <Route path="explore/media/:mediaToken" element={<ExploreMedia />} />
        <Route path="moderation/job-search" element={<JobTokenSearch />} />
        <Route path="moderation/job/:jobToken" element={<JobInfo />} />
        <Route
          path="moderation/debug-logs-search"
          element={<DebugLogsSearch />}
        />
        <Route
          path="moderation/debug-logs/:eventToken"
          element={<DebugLogs />}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
