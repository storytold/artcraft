// Toast notifications surface. The lib reports user-visible state
// changes (storage errors, render failures, "couldn't enqueue export")
// through this adapter so the host can route them into whatever toast
// system it already uses. OpenCut uses sonner directly; we go through
// this adapter so Artcraft can route into @storyteller/ui-toaster
// (or wrap, ignore, or log them differently).
//
// Levels match the typical toast library API. The `description` slot
// is optional context for the user — kept separate from `message` so
// hosts can render them in two visual tiers if desired.

export interface ToastOptions {
  description?: string;
  // Optional bag for host-specific opts (icon, persist, duration, etc.)
  // The lib never reads these — they're a pass-through for the host
  // adapter to interpret.
  meta?: Record<string, unknown>;
}

export interface ToastAdapter {
  info(message: string, options?: ToastOptions): void;
  success(message: string, options?: ToastOptions): void;
  warning(message: string, options?: ToastOptions): void;
  error(message: string, options?: ToastOptions): void;
}
