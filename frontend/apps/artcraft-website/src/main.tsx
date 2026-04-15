import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import * as ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/app";
import { StorytellerApiHostStore, UsersApi } from "@storyteller/api";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// In development, route API through the Vite dev server origin to avoid CORS
if (import.meta.env.DEV) {
  try {
    const origin = window.location.origin;
    StorytellerApiHostStore.getInstance().setApiSchemeAndHost(origin);
  } catch (e) {
    console.warn("Failed to set dev API host override", e);
  }
}

// Cache the referrer immediately — it can change or disappear on navigation.
// Only set once so subsequent in-site navigations don't overwrite the original.
if (!(window as any).cached_referrer) {
  (window as any).cached_referrer = document.referrer || undefined;
}
if (!(window as any).cached_landing_url) {
  (window as any).cached_landing_url = window.location.href || undefined;
}

// Fire-and-forget: log the referral once per browser session
if (!sessionStorage.getItem("referral_logged")) {
  sessionStorage.setItem("referral_logged", "1");
  new UsersApi()
    .LogWebReferral({ maybeReferralUrl: (window as any).cached_referrer })
    .then(() => {
      console.log("maybeReferralUrl", (window as any).cached_referrer);
    })
    .catch(() => {});
}

root.render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);
