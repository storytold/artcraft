import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import * as ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/app";
import { StorytellerApiHostStore, UsersApi } from "@storyteller/api";
import { captureLandingContext, getReferrer } from "@storyteller/common";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// In development, route API through the Vite dev server origin to avoid CORS
if (import.meta.env.DEV) {
  try {
    StorytellerApiHostStore.getInstance().setApiSchemeAndHost(
      window.location.origin,
    );
    // NB: This is for Brandon to test with storyteller-web locally:
    StorytellerApiHostStore.getInstance().setDevelopment();
  } catch (e) {
    console.warn("Failed to set dev API host override", e);
  }
}

// Persist landing context (referral username, landing URL, referrer) to apex-
// domain cookies so attribution survives the getartcraft.com →
// app.getartcraft.com hop. First visit wins.
captureLandingContext();

// Fire-and-forget: log the referral once per browser session
if (!sessionStorage.getItem("referral_logged")) {
  sessionStorage.setItem("referral_logged", "1");
  const referrer = getReferrer();
  new UsersApi()
    .LogWebReferral({ maybeReferralUrl: referrer })
    .then(() => {
      console.log("maybeReferralUrl", referrer);
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
