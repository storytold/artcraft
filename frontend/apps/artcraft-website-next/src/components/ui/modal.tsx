"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { CloseButton } from "./close-button";

/*
 * Ported from @storyteller/ui-modal, simplified for the marketing site (no
 * dragging/resizing/stacking): centered squared panel on a raised surface
 * with a hairline border, dim backdrop, Escape and outside-click dismissal.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  className?: string;
  backdropClassName?: string;
  childPadding?: boolean;
  showClose?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  /** Title for assistive tech when no visible title is rendered. */
  accessibleTitle?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  className,
  backdropClassName,
  childPadding = true,
  showClose = true,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  accessibleTitle,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Two-frame enter so the opening transition actually plays.
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Scroll lock while open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        aria-hidden
        onClick={() => closeOnOutsideClick && onClose()}
        className={twMerge(
          "fixed inset-0 bg-black/70 transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0",
          backdropClassName,
        )}
      />
      <div className="pointer-events-none flex min-h-full items-center justify-center p-0 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title != null ? titleId : undefined}
          aria-label={title == null ? (accessibleTitle ?? "Dialog") : undefined}
          className={twMerge(
            "pointer-events-auto relative w-full max-w-lg rounded-none border border-line bg-bg-raised text-left align-middle text-ink",
            childPadding && "p-4",
            "transition-[opacity,transform] duration-200",
            entered
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-2.5 scale-95 opacity-0",
            className,
          )}
        >
          {title != null && (
            <h2
              id={titleId}
              className="mb-4 flex items-center gap-3 pr-10 font-display text-xl font-medium text-ink-strong"
            >
              {title}
            </h2>
          )}
          {children}
          {showClose && (
            <CloseButton onClick={onClose} className="absolute right-2.5 top-2.5" />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
