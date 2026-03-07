import { Route, Routes, Navigate } from "react-router-dom";
import Download from "../pages/download";
import Media from "../pages/media";
import PressKit from "../pages/press-kit";
import Navbar from "../components/navbar";
import Landing2 from "../pages/landing2";
import LandingSD2 from "../pages/landing-sd2";
import TutorialsPage from "../pages/tutorials";
import TutorialsArticle from "../pages/tutorials/article";
import FaqIndex from "../pages/faq/index";
import FaqArticle from "../pages/faq/article";
import NewsIndex from "../pages/news/news-index";
import NewsPost from "../pages/news/news-post";
import Pricing from "../pages/pricing";
import Login from "../pages/login";
import Signup from "../pages/signup";
import ForgotPassword, { VerifyReset } from "../pages/forgot-password";
import Welcome from "../pages/welcome";
import Onboarding from "../pages/onboarding";
import { CheckoutSuccess, CheckoutCancel } from "../pages/checkout";

export function App() {
  return (
    <div className="relative">
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing2 />} />
        <Route path="/seedance-2" element={<LandingSD2 />} />
        <Route path="/download" element={<Download />} />
        <Route path="/media" element={<Media />} />
        <Route path="/media/:id" element={<Media />} />
        <Route path="/press-kit" element={<PressKit />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/tutorials/:slug" element={<TutorialsArticle />} />
        <Route path="/faq" element={<FaqIndex />} />
        <Route path="/faq/:slug" element={<FaqArticle />} />
        <Route path="/news" element={<NewsIndex basePath="/news" />} />
        <Route path="/news/:slug" element={<NewsPost basePath="/news" />} />
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
    </div>
  );
}

export default App;
