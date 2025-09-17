import { StrictMode, useEffect } from "react";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import { BrowserRouter } from "react-router-dom";
import { PageEnigma } from "./pages/PageEnigma/PageEnigma";
import { createRoot } from "react-dom/client";
import "./styles/normalize.css";
import "./styles/tailwind.css";
import "./styles/base.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { pageHeight, pageWidth, persistLogin } from "~/signals";
import { SyncStorytellerApiConfig } from "./api/SyncStorytellerApiConfig";
import { posthog } from "posthog-js";

config.autoAddCss = false; /* eslint-disable import/first */

// TODO(bt,2025-04-19): Make these configurable
const ENV = {
  GOOGLE_API: "https://studio.storyteller.ai",
  FUNNEL_API: "https://studio.storyteller.ai",
  CDN_API: "https://cdn-2.fakeyou.com",
  GRAVATAR_API: "https://studio.storyteller.ai",
  DEPLOY_PRIME_URL: "https://studio.storyteller.ai",
};

const GlobalSettingsManager = ({ env }: { env: Record<string, string> }) => {
  console.log("GlobalSettingsManager()");

  SyncStorytellerApiConfig();

  useSignals();

  useSignalEffect(() => {
    persistLogin();
  });

  /// Initizations that depends on ENV vars ///
  function PostHogInit() {
    const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
    posthog.init(apiKey, {
      api_host: "https://us.i.posthog.com/",
      ui_host: "https://us.i.posthog.com/",
    });
  }

  useEffect(() => {
    EnvironmentVariables.initialize(env);
    if (import.meta.env.DEV) {
      return;
    }
    PostHogInit();
  }, [env]);

  // Apply stored theme early on mount
  useEffect(() => {
    const key = "st-theme";
    const value = (localStorage.getItem(key) || "gray").trim();
    const allowed = ["light", "gray", "black", "aurora", "sunset", "gradient"];
    const normalized = value === "gradient" ? "aurora" : value;
    const theme = allowed.includes(value) ? (normalized as string) : "gray";
    const root = document.documentElement;
    const toRemove: string[] = [];
    root.classList.forEach((c) => {
      if (c.startsWith("theme-")) toRemove.push(c);
    });
    toRemove.forEach((c) => root.classList.remove(c));
    root.classList.add(`theme-${theme}`);
  }, []);

  /// Initizations that run only once on 1ST mount ///
  function setPage() {
    // TODO address this issue with zooming
    pageHeight.value = window.innerHeight;
    pageWidth.value = window.innerWidth;
  }

  useEffect(() => {
    setPage();
    window.addEventListener("resize", setPage);
    return () => {
      window.removeEventListener("resize", setPage);
    };
  }, []);

  return null;
};

// TODO: Replace environment variables from `root.tsx`
createRoot(document.getElementById("root")!).render(
  <>
    <StrictMode>
      <BrowserRouter>
        <GlobalSettingsManager env={ENV} />
        <div className="topbar-spacer" data-tauri-drag-region={true} />
        <PageEnigma />
      </BrowserRouter>
    </StrictMode>
  </>,
);
