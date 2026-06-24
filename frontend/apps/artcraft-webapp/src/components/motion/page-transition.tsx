import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { pageFadeVariants } from "../../lib/motion";

// Routes whose dynamic sub-segments should NOT replay the page transition.
// Switching scenes (`/edit-3d/:token`), library filters (`/library/:slug`) or
// media items (`/media/:id`) stays *within* a section — re-fading the whole
// shell on every param change would feel laggy and would needlessly remount
// heavy editors. Section changes (Home → Create Image) still animate.
const SECTION_PREFIXES = [
  "/edit-3d",
  "/video-editor",
  "/library",
  "/media",
] as const;

/** Collapse a pathname to a stable key for its app section. */
export function routeSectionKey(pathname: string): string {
  const section = SECTION_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return section ?? pathname;
}

/**
 * Wraps the routed `<Outlet />` so navigating between app sections fades the
 * new page in. Enter-only (no exit) keeps navigation feeling instant — the old
 * page is replaced immediately and the new one fades up over it.
 *
 * The fade is opacity-only by design; see `pageFadeVariants` for why a
 * transform here would break `position: fixed` page chrome.
 *
 * The wrapper mirrors `SidebarInset`'s flex slot (`flex-1 flex-col min-h-0`) so
 * pages that rely on `h-full` (the 3D/video editors) or `min-h-full` (scrolling
 * pages like Home) keep resolving their heights exactly as before.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={routeSectionKey(pathname)}
      variants={pageFadeVariants}
      initial="initial"
      animate="animate"
      className="flex w-full flex-1 flex-col min-h-0"
    >
      {children}
    </motion.div>
  );
}
