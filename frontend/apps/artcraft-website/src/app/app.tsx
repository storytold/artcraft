import { useEffect } from "react";
import {
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import Download from "../pages/download";
import Media from "../pages/media";
import PressKit from "../pages/press-kit";
import Navbar from "../components/navbar";
import { ToastContainer } from "../components/toast/toast";
import { WebappRedirect } from "../components/webapp-redirect";
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
        <Route path="/pricing" element={<Pricing />} />

        {/* Legacy paths now hosted on the webapp — preserve query/hash so
            referral, Stripe return, and email-link tokens survive the hop. */}
        <Route path="/login" element={<WebappRedirect to="/login" />} />
        <Route path="/signup" element={<WebappRedirect to="/signup" />} />
        <Route
          path="/forgot-password"
          element={<WebappRedirect to="/forgot-password" />}
        />
        <Route
          path="/forgot-password/verify"
          element={<WebappRedirect to="/forgot-password/verify" />}
        />
        <Route
          path="/create-image"
          element={<WebappRedirect to="/create-image" />}
        />
        <Route
          path="/create-video"
          element={<WebappRedirect to="/create-video" />}
        />
        <Route
          path="/background-change"
          element={<WebappRedirect to="/background-change" />}
        />
        <Route path="/library" element={<WebappRedirect to="/library" />} />
        <Route
          path="/library/:filter"
          element={<WebappRedirect to="/library/:filter" />}
        />
        <Route path="/referrals" element={<WebappRedirect to="/referrals" />} />
        <Route path="/welcome" element={<WebappRedirect to="/welcome" />} />
        <Route
          path="/onboarding"
          element={<WebappRedirect to="/onboarding" />}
        />
        <Route
          path="/checkout/success"
          element={<WebappRedirect to="/checkout/success" />}
        />
        <Route
          path="/checkout/cancel"
          element={<WebappRedirect to="/checkout/cancel" />}
        />
        <Route
          path="/checkout_success"
          element={<WebappRedirect to="/checkout/success" />}
        />
        <Route
          path="/checkout_cancel"
          element={<WebappRedirect to="/checkout/cancel" />}
        />
        <Route
          path="/portal_closed"
          element={<WebappRedirect to="/checkout/cancel" />}
        />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
