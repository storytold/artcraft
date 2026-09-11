import type { ToastAdapter } from "../toast";

// Default ToastAdapter that logs to the browser console. Useful for
// the lib's standalone smoke test (where there's no host toaster
// mounted) and as a fallback. Hosts (Artcraft) replace this with an
// adapter that calls into @storyteller/ui-toaster.

function format(message: string, description?: string): string[] {
  return description ? [message, "\n", description] : [message];
}

export const consoleToast: ToastAdapter = {
  info(message, options) {
    console.info(...format(message, options?.description));
  },
  success(message, options) {
    console.log(...format(message, options?.description));
  },
  warning(message, options) {
    console.warn(...format(message, options?.description));
  },
  error(message, options) {
    console.error(...format(message, options?.description));
  },
};
