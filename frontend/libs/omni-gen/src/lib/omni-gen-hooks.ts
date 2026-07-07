import { useEffect, useState } from "react";
import { OmniGenApi } from "@storyteller/api";
import type {
  OmniGenAudioModelDetails,
  OmniGenImageModelInfo,
  OmniGenVideoModelInfo,
} from "@storyteller/api";

// Shown when the OmniGen service is unavailable (e.g. returns 5xx). Separate
// copy for the two failure points so the user knows which step failed.
export const OMNI_MODELS_OUTAGE_MESSAGE =
  "Couldn't load models - the generation service may be down. Try again shortly.";
export const OMNI_GENERATE_OUTAGE_MESSAGE =
  "Couldn't start generation - the service is temporarily unavailable. Try again shortly.";

// ── Error notifier ───────────────────────────────────────────────────────

// User-facing outage notifications are injected by the host app (each app has
// its own toast component) via `setOmniGenErrorNotifier` at startup, before the
// first hook mounts. Defaults to a no-op; the console logging below always runs
// so failures are never silent.
export type OmniGenErrorNotifier = (message: string) => void;

let errorNotifier: OmniGenErrorNotifier = () => {};

export const setOmniGenErrorNotifier = (notifier: OmniGenErrorNotifier): void => {
  errorNotifier = notifier;
};

// ── Singleton caches (fetch once per session) ────────────────────────────

let imageModelsCache: OmniGenImageModelInfo[] | null = null;
let imageModelsFetching = false;
let imageModelsError: string | null = null;
let imageModelsListeners: Array<() => void> = [];

let videoModelsCache: OmniGenVideoModelInfo[] | null = null;
let videoModelsFetching = false;
let videoModelsError: string | null = null;
let videoModelsListeners: Array<() => void> = [];

let audioModelsCache: OmniGenAudioModelDetails[] | null = null;
let audioModelsFetching = false;
let audioModelsError: string | null = null;
let audioModelsListeners: Array<() => void> = [];

function notifyImageListeners() {
  imageModelsListeners.forEach((cb) => cb());
  imageModelsListeners = [];
}

function notifyVideoListeners() {
  videoModelsListeners.forEach((cb) => cb());
  videoModelsListeners = [];
}

function notifyAudioListeners() {
  audioModelsListeners.forEach((cb) => cb());
  audioModelsListeners = [];
}

function fetchImageModelsOnce() {
  if (imageModelsCache || imageModelsFetching) return;
  imageModelsFetching = true;
  imageModelsError = null;
  const api = new OmniGenApi();
  api.getImageModels().then(
    (res) => {
      imageModelsFetching = false;
      if (res.success && res.models?.length) {
        imageModelsCache = res.models.filter((m) => m.is_disabled !== true);
      } else {
        imageModelsError = "No image models returned from API";
        console.warn("[OmniGen] Image models response:", res);
        errorNotifier(OMNI_MODELS_OUTAGE_MESSAGE);
      }
      notifyImageListeners();
    },
    (err) => {
      imageModelsFetching = false;
      imageModelsError = err?.message ?? "Failed to fetch image models";
      console.error("[OmniGen] Failed to fetch image models:", err);
      errorNotifier(OMNI_MODELS_OUTAGE_MESSAGE);
      notifyImageListeners();
    },
  );
}

function fetchVideoModelsOnce() {
  if (videoModelsCache || videoModelsFetching) return;
  videoModelsFetching = true;
  videoModelsError = null;
  const api = new OmniGenApi();
  api.getVideoModels().then(
    (res) => {
      videoModelsFetching = false;
      if (res.success && res.models?.length) {
        videoModelsCache = res.models.filter((m) => m.is_disabled !== true);
      } else {
        videoModelsError = "No video models returned from API";
        console.warn("[OmniGen] Video models response:", res);
        errorNotifier(OMNI_MODELS_OUTAGE_MESSAGE);
      }
      notifyVideoListeners();
    },
    (err) => {
      videoModelsFetching = false;
      videoModelsError = err?.message ?? "Failed to fetch video models";
      console.error("[OmniGen] Failed to fetch video models:", err);
      errorNotifier(OMNI_MODELS_OUTAGE_MESSAGE);
      notifyVideoListeners();
    },
  );
}

function fetchAudioModelsOnce() {
  if (audioModelsCache || audioModelsFetching) return;
  audioModelsFetching = true;
  audioModelsError = null;
  const api = new OmniGenApi();
  api.getAudioModels().then(
    (res) => {
      audioModelsFetching = false;
      if (res.success && res.models?.length) {
        audioModelsCache = res.models.filter((m) => m.is_disabled !== true);
      } else {
        audioModelsError = "No audio models returned from API";
        console.warn("[OmniGen] Audio models response:", res);
        errorNotifier(OMNI_MODELS_OUTAGE_MESSAGE);
      }
      notifyAudioListeners();
    },
    (err) => {
      audioModelsFetching = false;
      audioModelsError = err?.message ?? "Failed to fetch audio models";
      console.error("[OmniGen] Failed to fetch audio models:", err);
      errorNotifier(OMNI_MODELS_OUTAGE_MESSAGE);
      notifyAudioListeners();
    },
  );
}

// ── Hooks ────────────────────────────────────────────────────────────────

export function useOmniGenImageModels(): {
  models: OmniGenImageModelInfo[];
  isLoading: boolean;
  error: string | null;
} {
  const [models, setModels] = useState<OmniGenImageModelInfo[]>(
    imageModelsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!imageModelsCache);
  const [error, setError] = useState<string | null>(imageModelsError);

  useEffect(() => {
    if (imageModelsCache) {
      setModels(imageModelsCache);
      setIsLoading(false);
      setError(null);
      return;
    }

    const onReady = () => {
      setIsLoading(false);
      if (imageModelsCache) {
        setModels(imageModelsCache);
        setError(null);
      } else {
        setError(imageModelsError);
      }
    };

    imageModelsListeners.push(onReady);
    fetchImageModelsOnce();

    return () => {
      imageModelsListeners = imageModelsListeners.filter(
        (cb) => cb !== onReady,
      );
    };
  }, []);

  return { models, isLoading, error };
}

export function useOmniGenVideoModels(): {
  models: OmniGenVideoModelInfo[];
  isLoading: boolean;
  error: string | null;
} {
  const [models, setModels] = useState<OmniGenVideoModelInfo[]>(
    videoModelsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!videoModelsCache);
  const [error, setError] = useState<string | null>(videoModelsError);

  useEffect(() => {
    if (videoModelsCache) {
      setModels(videoModelsCache);
      setIsLoading(false);
      setError(null);
      return;
    }

    const onReady = () => {
      setIsLoading(false);
      if (videoModelsCache) {
        setModels(videoModelsCache);
        setError(null);
      } else {
        setError(videoModelsError);
      }
    };

    videoModelsListeners.push(onReady);
    fetchVideoModelsOnce();

    return () => {
      videoModelsListeners = videoModelsListeners.filter(
        (cb) => cb !== onReady,
      );
    };
  }, []);

  return { models, isLoading, error };
}

export function useOmniGenAudioModels(): {
  models: OmniGenAudioModelDetails[];
  isLoading: boolean;
  error: string | null;
} {
  const [models, setModels] = useState<OmniGenAudioModelDetails[]>(
    audioModelsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(!audioModelsCache);
  const [error, setError] = useState<string | null>(audioModelsError);

  useEffect(() => {
    if (audioModelsCache) {
      setModels(audioModelsCache);
      setIsLoading(false);
      setError(null);
      return;
    }

    const onReady = () => {
      setIsLoading(false);
      if (audioModelsCache) {
        setModels(audioModelsCache);
        setError(null);
      } else {
        setError(audioModelsError);
      }
    };

    audioModelsListeners.push(onReady);
    fetchAudioModelsOnce();

    return () => {
      audioModelsListeners = audioModelsListeners.filter(
        (cb) => cb !== onReady,
      );
    };
  }, []);

  return { models, isLoading, error };
}
