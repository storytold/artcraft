import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faExclamation,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────────

type ToastType = "success" | "error";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
}

// ── Global API ─────────────────────────────────────────────────────────────

const TOAST_EVENT = "app-toast";

interface ToastDetail {
  type: ToastType;
  message: string;
  duration?: number;
}

export function showToast(type: ToastType, message: string, duration?: number) {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: { type, message, duration },
    }),
  );
}

export const toast = {
  success: (message: string, opts?: { duration?: number }) =>
    showToast("success", message, opts?.duration),
  error: (message: string, opts?: { duration?: number }) =>
    showToast("error", message, opts?.duration),
};

// ── Component ──────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 6000;
const DEDUP_WINDOW = 2000;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { type, message, duration } = (e as CustomEvent<ToastDetail>)
        .detail;
      const now = Date.now();

      // Deduplicate: skip if same message within 2s
      setToasts((prev) => {
        if (
          prev.some(
            (t) => t.message === message && now - t.createdAt < DEDUP_WINDOW,
          )
        )
          return prev;

        const id = crypto.randomUUID();
        const toast: Toast = { id, type, message, createdAt: now };

        // Auto-dismiss
        setTimeout(() => {
          setToasts((p) => p.filter((t) => t.id !== id));
        }, duration ?? DEFAULT_DURATION);

        return [...prev, toast];
      });
    };

    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed sm:top-16 top-14 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 z-[100] flex flex-col items-center sm:items-end gap-2 px-4 sm:px-0 max-w-[calc(100vw-1rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="glass flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white animate-toast-in"
        >
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
              toast.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            <FontAwesomeIcon
              icon={toast.type === "success" ? faCheck : faExclamation}
              className="h-3 w-3 text-white"
            />
          </div>
          <span className="flex-1 text-white/90 whitespace-nowrap overflow-hidden text-ellipsis">
            {toast.message}
          </span>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-1 text-white/40 transition-colors hover:text-white/80"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
