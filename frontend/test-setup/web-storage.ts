// Node 22+ defines `localStorage` and `sessionStorage` on globalThis, as
// undefined unless Node runs with --localstorage-file. Vitest's jsdom
// environment only copies window globals that globalThis lacks, so under
// those Node versions both stay undefined and anything touching storage
// crashes. Point them at jsdom's implementations, reached through the
// `jsdom` global the environment exposes (`window` here is globalThis).
const STORAGE_KEYS = ["localStorage", "sessionStorage"] as const;

type JsdomGlobal = { jsdom?: { window?: Record<string, unknown> } };

const jsdomWindow = (globalThis as JsdomGlobal).jsdom?.window;

for (const key of STORAGE_KEYS) {
  const storage = jsdomWindow?.[key];
  if (globalThis[key] === undefined && storage) {
    Object.defineProperty(globalThis, key, {
      value: storage,
      configurable: true,
      writable: true,
    });
  }
}
