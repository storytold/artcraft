import { useEffect } from "react";
import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import Download from "../pages/download";
import Media from "../pages/media";
import PressKit from "../pages/press-kit";
import Navbar from "../components/navbar";
import { ToastContainer } from "../components/toast/toast";
import CreateImage from "../pages/create-image";
import CreateVideo from "../pages/create-video";
import CreateVFX from "../pages/create-vfx";
//import Landing2 from "../pages/landing2";
import Landing3 from "../pages/landing3";
import LandingSD2 from "../pages/landing-sd2";
import TutorialsPage from "../pages/tutorials";
import TutorialsArticle from "../pages/tutorials/article";
import FaqIndex from "../pages/faq/index";
import FaqArticle from "../pages/faq/article";
import NewsIndex from "../pages/news/news-index";
import NewsPost from "../pages/news/news-post";
import Pricing from "../pages/pricing";
import Support from "../pages/support/support";
import Login from "../pages/login";
import Signup from "../pages/signup";
import ForgotPassword, { VerifyReset } from "../pages/forgot-password";
import Welcome from "../pages/welcome";
import Onboarding from "../pages/onboarding";
import Library from "../pages/library";
import { CheckoutSuccess, CheckoutCancel } from "../pages/checkout";

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
    <div className="relative">
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing3 />} />
        <Route path="/landing3" element={<Landing3 />} />
        <Route path="/create-image" element={<CreateImage />} />
        <Route path="/create-video" element={<CreateVideo />} />
        <Route path="/background-change" element={<CreateVFX />} />
        <Route path="/seedance-2" element={<LandingSD2 />} />
        <Route path="/download" element={<Download />} />
        <Route path="/media" element={<Media />} />
        <Route path="/media/:id" element={<Media />} />
        <Route path="/press-kit" element={<PressKit />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/tutorials/:slug" element={<TutorialsArticle />} />
        <Route path="/faq" element={<FaqIndex />} />
        <Route path="/faq/:slug" element={<FaqArticle />} />
        <Route path="/support" element={<Support />} />
        <Route path="/news" element={<NewsIndex basePath="/news" />} />
        <Route path="/news/:slug" element={<NewsPost basePath="/news" />} />
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
        {/* Redirects for underscore-based URLs (legacy Stripe config) */}
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
      <ToastContainer />
    </div>
  );
}

export default App;
