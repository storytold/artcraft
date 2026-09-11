// Browser feature detection helpers used by the input subsystem.
// Pointer Lock behaves differently on Safari/WebKit, so the input
// hooks fall back to drag-based control there.

export const isSafariOrWebKit = (): boolean => {
  const ua = navigator.userAgent;
  const isWebKit =
    /AppleWebKit/i.test(ua) && !/Chrome|Chromium|Edg|OPR|CriOS|FxiOS/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isSafari || isWebKit;
};

export const hasApplePay = (): boolean => {
  // @ts-expect-error Apple Pay is not defined in TypeScript
  return !!window.ApplePaySession;
};

export const isSafari = (): boolean => isSafariOrWebKit() || hasApplePay();

export const isPointerLockSupported = (): boolean => !isSafari();
