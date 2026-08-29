import { StrictMode, useEffect } from "react";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import { BrowserRouter } from "react-router-dom";
import { MainApp } from "./pages/MainApp";
import { GlobalFileDropHandler } from "./components/GlobalFileDropHandler/GlobalFileDropHandler";
import { createRoot } from "react-dom/client";
import "./styles/normalize.css";
import "./styles/tailwind.css";
import "./styles/base.css";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { pageHeight, pageWidth, persistLogin } from "~/signals";
import {
  RefreshSessionAfterApiHostChange,
  SyncStorytellerApiConfig,
} from "./api/SyncStorytellerApiConfig";
import { posthog } from "posthog-js";
import { SoundManager } from "@storyteller/soundboard";
import { useModelsStore } from "@storyteller/tauri-api";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { bootstrapArtcraftApp } from "./bootstrapArtcraftApp";

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

  useEffect(() => {
    SoundManager.install();
  }, []);

  // Reconcile the model dropdowns against the backend omni listing once on boot.
  // The store is already seeded with the static overlay, so a failure here is a
  // no-op (the UI keeps the overlay models).
  useEffect(() => {
    void useModelsStore.getState().loadModelsFromBackend();
  }, []);

  return null;
};

const rootElement = document.getElementById("root")!;

const renderArtcraft = () => {
  // TODO: Replace environment variables from `root.tsx`
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <GlobalSettingsManager env={ENV} />
        <div className="topbar-spacer" data-tauri-drag-region={true} />
        <MainApp />
        <GlobalFileDropHandler />
      </BrowserRouter>
    </StrictMode>,
  );
};

const renderApiHostError = (error: unknown) => {
  console.error("ArtCraft API configuration failed", error);
  rootElement.textContent =
    "ArtCraft could not initialize its API configuration. Please restart the app.";
};

void bootstrapArtcraftApp({
  isDesktopApp: IsDesktopApp,
  syncApiHost: SyncStorytellerApiConfig,
  refreshSession: RefreshSessionAfterApiHostChange,
  renderApp: renderArtcraft,
  renderApiHostError,
  reportSessionRefreshError: (error) => {
    console.error(
      "ArtCraft session refresh failed after API host change",
      error,
    );
  },
});
