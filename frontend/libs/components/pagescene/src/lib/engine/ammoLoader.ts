// Singleton loader for the Ammo.js physics WASM glue. Editor's
// constructor used to inject `<script src="jsm/libs/ammo.wasm.js">`
// into document.body on every construction, which produced duplicate
// tags under React strict mode and provider remounts. We now ensure
// the script is appended exactly once, regardless of how many times
// the Editor is constructed across the app's lifetime.

let ammoLoadPromise: Promise<void> | null = null;

export const ensureAmmoLoaded = (): Promise<void> => {
  if (ammoLoadPromise) return ammoLoadPromise;

  ammoLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      // SSR / non-DOM environments — resolve immediately; Ammo
      // wouldn't be usable anyway, and Editor consumers only need
      // the promise to settle.
      resolve();
      return;
    }

    // If something already loaded ammo (e.g. a prior session before
    // this module took over), don't re-add it. Detect by querying for
    // an existing tag; the ammo.wasm.js script defines a global
    // `Ammo` symbol when it finishes evaluating.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="jsm/libs/ammo.wasm.js"]',
    );
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "jsm/libs/ammo.wasm.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load jsm/libs/ammo.wasm.js"));
    document.body.appendChild(script);
  });

  return ammoLoadPromise;
};
