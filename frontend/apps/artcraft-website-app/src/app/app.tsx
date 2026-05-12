import { useEffect } from "react";
import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import Home from "../pages/home";
import Media from "../pages/media";
import { ToastContainer } from "../components/toast/toast";
import CreateImage from "../pages/create-image";
import CreateVideo from "../pages/create-video";
import CreateVFX from "../pages/create-vfx";
import Pricing from "../pages/pricing";
import Support from "../pages/support/support";
import Login from "../pages/login";
import Signup from "../pages/signup";
import ForgotPassword, { VerifyReset } from "../pages/forgot-password";
import Welcome from "../pages/welcome";
import Onboarding from "../pages/onboarding";
import Library from "../pages/library";
import { CheckoutSuccess, CheckoutCancel } from "../pages/checkout";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import { AppSidebar } from "../components/sidebar/app-sidebar";
import { TopBar } from "../components/topbar/topbar";

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

export function App() {
  return (
    <SidebarProvider defaultOpen>
      <ScrollToTop />
      <AppSidebar />
      <SidebarInset className="bg-[#121212]">
        <TopBar />
        <div className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-image" element={<CreateImage />} />
            <Route path="/create-video" element={<CreateVideo />} />
            <Route path="/background-change" element={<CreateVFX />} />
            <Route path="/media" element={<Media />} />
            <Route path="/media/:id" element={<Media />} />
            <Route path="/support" element={<Support />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:filter" element={<Library />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/forgot-password/verify" element={<VerifyReset />} />
            <Route path="/welcome" element={<Welcome />} />
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
          </Routes>
        </div>
        <ToastContainer />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
