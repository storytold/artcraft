import { useEffect, type ReactNode } from "react";
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
import { WebappRedirect } from "../components/webapp-redirect";
import CreateImage from "../pages/create-image";
import CreateVideo from "../pages/create-video";
import CreateVFX from "../pages/create-vfx";
//import Landing2 from "../pages/landing2";
import Landing3 from "../pages/landing3";
import LandingSD2 from "../pages/landing-sd2";
import LandingSD25 from "../pages/landing-sd25";
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
import Referrals from "../pages/referrals";
import { CheckoutSuccess, CheckoutCancel } from "../pages/checkout";
import { USE_WEBAPP_FOR_APP_FEATURES } from "../config/links";

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

// Returns the local page when the feature flag is off, otherwise a redirect
// to the equivalent path on the webapp (preserving query string + hash).
function appOrWebapp(localElement: ReactNode, webappPath: string): ReactNode {
  return USE_WEBAPP_FOR_APP_FEATURES ? (
    <WebappRedirect to={webappPath} />
  ) : (
    localElement
  );
}

export function App() {
  return (
    <div className="relative">
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing3 />} />
        <Route path="/landing3" element={<Landing3 />} />
        <Route path="/seedance-2" element={<LandingSD2 />} />
        <Route path="/seedance2-5" element={<LandingSD25 />} />
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
        <Route path="/pricing" element={<Pricing />} />

        {/* App routes — flip USE_WEBAPP_FOR_APP_FEATURES in config/links.ts
            to render these locally instead of redirecting to the webapp. */}
        <Route path="/login" element={appOrWebapp(<Login />, "/login")} />
        <Route path="/signup" element={appOrWebapp(<Signup />, "/signup")} />
        <Route
          path="/forgot-password"
          element={appOrWebapp(<ForgotPassword />, "/forgot-password")}
        />
        <Route
          path="/forgot-password/verify"
          element={appOrWebapp(<VerifyReset />, "/forgot-password/verify")}
        />
        <Route
          path="/create-image"
          element={appOrWebapp(<CreateImage />, "/create-image")}
        />
        <Route
          path="/create-video"
          element={appOrWebapp(<CreateVideo />, "/create-video")}
        />
        <Route
          path="/background-change"
          element={appOrWebapp(<CreateVFX />, "/background-change")}
        />
        <Route
          path="/library"
          element={appOrWebapp(<Library />, "/library")}
        />
        <Route
          path="/library/:filter"
          element={appOrWebapp(<Library />, "/library/:filter")}
        />
        <Route
          path="/referrals"
          element={appOrWebapp(<Referrals />, "/referrals")}
        />
        <Route
          path="/welcome"
          element={appOrWebapp(<Welcome />, "/welcome")}
        />
        <Route
          path="/onboarding"
          element={appOrWebapp(<Onboarding />, "/onboarding")}
        />
        <Route
          path="/checkout/success"
          element={appOrWebapp(<CheckoutSuccess />, "/checkout/success")}
        />
        <Route
          path="/checkout/cancel"
          element={appOrWebapp(<CheckoutCancel />, "/checkout/cancel")}
        />
        {/* Legacy underscore Stripe paths — always redirect to the canonical
            slash form, going local or webapp based on the flag. */}
        <Route
          path="/checkout_success"
          element={
            USE_WEBAPP_FOR_APP_FEATURES ? (
              <WebappRedirect to="/checkout/success" />
            ) : (
              <Navigate to="/checkout/success" replace />
            )
          }
        />
        <Route
          path="/checkout_cancel"
          element={
            USE_WEBAPP_FOR_APP_FEATURES ? (
              <WebappRedirect to="/checkout/cancel" />
            ) : (
              <Navigate to="/checkout/cancel" replace />
            )
          }
        />
        <Route
          path="/portal_closed"
          element={
            USE_WEBAPP_FOR_APP_FEATURES ? (
              <WebappRedirect to="/checkout/cancel" />
            ) : (
              <Navigate to="/checkout/cancel" replace />
            )
          }
        />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
