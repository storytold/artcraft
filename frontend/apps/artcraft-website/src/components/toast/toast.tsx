import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleExclamation,
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

export function showToast(
  type: ToastType,
  message: string,
  duration?: number,
) {
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: { type, message, duration },
    }),
  );
}

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
            (t) =>
              t.message === message && now - t.createdAt < DEDUP_WINDOW,
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
    <div className="fixed top-16 right-6 z-[100] flex flex-col items-end gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm shadow-lg backdrop-blur-xl animate-toast-in ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/15 text-green-200"
              : "border-red-500/30 bg-red-500/15 text-red-200"
          }`}
        >
          <FontAwesomeIcon
            icon={toast.type === "success" ? faCheck : faCircleExclamation}
            className={
              toast.type === "success" ? "text-green-400" : "text-red-400"
            }
          />
          <span>{toast.message}</span>
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
