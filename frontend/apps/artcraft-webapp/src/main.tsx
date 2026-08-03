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

// In development, route API calls through the Vite dev server origin to avoid
// CORS. NB: that origin's `/v1` proxy forwards to https://api.storyteller.ai,
// so the default dev target is PRODUCTION — local work reads and writes real
// data and spends real credits.
//
// VITE_DEV_API_HOST overrides it. `nx serve artcraft-webapp --mode fake` sets
// it to http://localhost:12345, the local fake-storyteller-web stand-in (see
// apps/fake-storyteller-web/README.md); that is also how to point at a local
// storyteller-web, replacing the old commented-out setDevelopment() call.
//
// `import.meta.env.DEV` is statically false in a production build, so this
// block is dropped from the bundle entirely.
if (import.meta.env.DEV) {
  try {
    StorytellerApiHostStore.getInstance().setApiSchemeAndHost(
      import.meta.env.VITE_DEV_API_HOST || window.location.origin,
    );
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
