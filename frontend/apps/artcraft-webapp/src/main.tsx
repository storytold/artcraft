import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import * as ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/app";
import { StorytellerApiHostStore, UsersApi } from "@storyteller/api";
import { captureLandingContext, getReferrer } from "@storyteller/common";
import { setOmniGenErrorNotifier } from "@storyteller/omni-gen";
import { setToastDelegate } from "@storyteller/ui-toaster";
import { toast } from "./components/toast/toast";

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
    // Backend devs: launch with USE_LOCAL_API=1 (see
    // script/website/unix_frontend_webapp_dev.sh) to point API calls at a
    // local storyteller-web (http://localhost:12345). When unset — the
    // frontend-dev default — this branch never runs and API calls hit
    // production. Do not comment this in or out; set the env var instead.
    const useLocalApi = import.meta.env.VITE_USE_LOCAL_API;
    if (useLocalApi === "1" || useLocalApi === "true") {
      StorytellerApiHostStore.getInstance().setDevelopment();
    }
  } catch (e) {
    console.warn("Failed to set dev API host override", e);
  }
}

// Surface omni model/generation outages through this app's toast component.
setOmniGenErrorNotifier((message) => toast.error(message));

// Shared libs (promptbox deck, gallery modal, …) fire react-hot-toast toasts,
// but this app renders its own ToastContainer and never mounts the
// react-hot-toast container — route those toasts here so limit/validation
// errors (e.g. "audio too long") actually show up.
setToastDelegate({
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
});

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
