import { useEffect } from "react";
import {
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import Home from "../pages/home";
import Media from "../pages/media";
import { ToastContainer } from "../components/toast/toast";
import CreateImage from "../pages/create-image";
import CreateVideo from "../pages/create-video";
import CreateVFX from "../pages/create-vfx";
import PageScene from "../pages/pagescene";
import VideoEditorPage from "../pages/video-editor";
import Pricing from "../pages/pricing";
import Support from "../pages/support/support";
import Login from "../pages/login";
import Signup from "../pages/signup";
import SetPassword from "../pages/set-password";
import { AuthLayout } from "../components/auth";
import ForgotPassword, { VerifyReset } from "../pages/forgot-password";
import Welcome from "../pages/welcome";
import Onboarding from "../pages/onboarding";
import Library from "../pages/library";
import Referrals from "../pages/referrals";
import { CheckoutSuccess, CheckoutCancel } from "../pages/checkout";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "../components/ui/sidebar";
import { AppSidebar } from "../components/sidebar/app-sidebar";
import { MobileBottomNav } from "../components/sidebar/mobile-bottom-nav";
import { TopBar } from "../components/topbar/topbar";
import { SignupCtaModal } from "../components/signup-cta-modal";
import { InsufficientCreditsModal } from "../components/insufficient-credits-modal";
import { useSession } from "../lib/session";

function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);
  return null;
}

function AuthCheckSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#101014]">
      <FontAwesomeIcon
        icon={faSpinnerThird}
        className="animate-spin text-4xl text-primary/80"
      />
    </div>
  );
}

function RequireAuth() {
  const { loggedIn, authChecked } = useSession();
  const location = useLocation();

  if (!authChecked) return <AuthCheckSpinner />;

  if (!loggedIn) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  return <Outlet />;
}

function ProtectedContent() {
  const { state, isMobile } = useSidebar();
  const { pathname } = useLocation();
  // Effective horizontal space taken by the sidebar — used by fixed-positioned
  // page chrome (e.g. promptboxes) to center within the content area.
  const sidebarOffset = isMobile
    ? "0px"
    : state === "expanded"
      ? "var(--sidebar-width)"
      : "calc(var(--sidebar-width-icon) + 1.5rem)";

  // The Edit 3D and video editors host the header's actions
  // (pricing/credits/task queue/profile) inside their own toolbar/header to
  // reclaim vertical space, so the global header is hidden there — desktop
  // only, since the mobile route shows a gate that still needs the header's
  // nav chrome.
  const hideTopBar =
    !isMobile &&
    (pathname === "/edit-3d" ||
      pathname.startsWith("/edit-3d/") ||
      pathname === "/video-editor" ||
      pathname.startsWith("/video-editor/"));

  return (
    <div
      className="flex flex-1 flex-col min-w-0 h-svh overflow-hidden"
      style={{ "--ac-sidebar-offset": sidebarOffset } as React.CSSProperties}
    >
      {!hideTopBar && <TopBar />}
      <SidebarInset className="flex-1 min-h-0 overflow-y-auto bg-[#121212]">
        <Outlet />
      </SidebarInset>
      {isMobile && <MobileBottomNav />}
    </div>
  );
}

function ProtectedLayout() {
  return (
    <SidebarProvider defaultOpen className="">
      <AppSidebar />
      <ProtectedContent />
    </SidebarProvider>
  );
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public — no chrome, no auth gate. login/signup share a layout route
            so the showcase pane (and its video) stays mounted when toggling
            between them. */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password/verify" element={<VerifyReset />} />

        {/* Public — sidebar/topbar chrome, but no auth gate. Generate actions
            inside the create pages pop a signup CTA modal for logged-out users. */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create-image" element={<CreateImage />} />
          <Route path="/create-video" element={<CreateVideo />} />
          <Route path="/background-change" element={<CreateVFX />} />
          <Route path="/edit-3d" element={<PageScene />} />
          <Route path="/edit-3d/:sceneToken" element={<PageScene />} />
          <Route path="/video-editor" element={<VideoEditorPage />} />
          <Route path="/video-editor/:projectId" element={<VideoEditorPage />} />
          <Route path="/support" element={<Support />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* Welcome is public so it stays reachable right after signup
              without losing the race against the session refresh that
              RequireAuth reads. The page itself drives the pricing/Stripe
              handoff via PricingTable. */}
          <Route path="/welcome" element={<Welcome />} />

          {/* Protected — sign-in required (user-owned content / billing flows) */}
          <Route element={<RequireAuth />}>
            <Route path="/media" element={<Media />} />
            <Route path="/media/:id" element={<Media />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:filter" element={<Library />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route
              path="/checkout_success"
              element={<Navigate to="/checkout/success" replace />}
            />
            <Route
              path="/checkout_cancel"
              element={<Navigate to="/checkout/cancel" replace />}
            />
            <Route
              path="/portal_closed"
              element={<Navigate to="/checkout/cancel" replace />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ToastContainer />
      <SignupCtaModal />
      <InsufficientCreditsModal />
    </>
  );
}

export default App;
