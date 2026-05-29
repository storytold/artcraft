import type { ToastAdapter, ToastOptions } from "@storyteller/ui-video-editor";
import { showToast } from "../../../components/toast/toast";

// Webapp ToastAdapter — routes lib toasts through the existing
// `showToast` event dispatcher in apps/artcraft-webapp/src/components/
// toast/toast.tsx. The webapp toast surface only renders success/error
// styles, so info/warning collapse to success/error respectively.
//
// ToastOptions.description is appended after a newline because the
// webapp toast UI doesn't render a separate description slot.

function formatMessage(message: string, options?: ToastOptions): string {
  if (!options?.description) return message;
  return `${message}\n${options.description}`;
}

export const webappToastAdapter: ToastAdapter = {
  info(message, options) {
    showToast("success", formatMessage(message, options));
  },
  success(message, options) {
    showToast("success", formatMessage(message, options));
  },
  warning(message, options) {
    showToast("error", formatMessage(message, options));
  },
  error(message, options) {
    showToast("error", formatMessage(message, options));
  },
};
