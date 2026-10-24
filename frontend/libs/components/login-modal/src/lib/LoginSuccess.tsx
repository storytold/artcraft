// A check-mark icon from the Lucide icon set.
import { CheckIcon } from "lucide-react";
// The look of this panel (CSS module: each class name is local to this file).
import styles from "./LoginSuccess.module.css";

// The confirmation panel shown after a successful login: a check mark, "Logged in as <name>", and a short caption.
// `username` is the display name of the person who just signed in.
export function LoginSuccess({ username }: { username: string }) {
  return (
    // `role="status"` plus `aria-live="polite"` make a screen reader announce the panel when it appears without
    // interrupting what it is reading; `aria-atomic` makes it read the whole panel, not just the changed part.
    <div className={styles.panel} role="status" aria-live="polite" aria-atomic="true">
      {/* The round badge holding the check mark; hidden from screen readers because the heading says it in words. */}
      <div className={styles.badge} aria-hidden="true">
        <CheckIcon size={28} strokeWidth={2} />
      </div>
      <h2 className={styles.heading}>
        Logged in as{" "}
        {/* The name is a separate span so the stylesheet can highlight it. */}
        <span className={styles.username}>{username}</span>
      </h2>
      <p className={styles.caption}>You're ready to create.</p>
    </div>
  );
}
