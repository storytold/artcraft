import type { ToastAdapter, ToastOptions } from "@storyteller/ui-video-editor";
import { ToastTypes } from "~/enums";
import { addToast } from "~/signals/toasts";

// Tauri ToastAdapter — routes lib toasts through the Artcraft desktop
// app's existing signal-based toast system (signals/toasts.ts +
// <Toaster /> mounted in MainApp).
//
// ToastTypes only has SUCCESS / WARNING / ERROR, so `info` collapses to
// SUCCESS (closest visual fallback). ToastOptions.description is
// concatenated after a newline because the toast UI is single-line.

function formatMessage(message: string, options?: ToastOptions): string {
  if (!options?.description) return message;
  return `${message}\n${options.description}`;
}

export const tauriToastAdapter: ToastAdapter = {
  info(message, options) {
    addToast(ToastTypes.SUCCESS, formatMessage(message, options));
  },
  success(message, options) {
    addToast(ToastTypes.SUCCESS, formatMessage(message, options));
  },
  warning(message, options) {
    addToast(ToastTypes.WARNING, formatMessage(message, options));
  },
  error(message, options) {
    addToast(ToastTypes.ERROR, formatMessage(message, options));
  },
};
