import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Stage3D,
  usePageSceneStore,
} from "@storyteller/ui-pagescene";
import { useSession } from "../../lib/session";
import { useWebAppPageSceneAdapter } from "./web-adapter";

// Stage3D renders its UI with `position: fixed` so its children
// (toolbar, prompt editor, history stack, gallery panel) overlay each
// other within the editor viewport. Inside the webapp's
// SidebarProvider/SidebarInset layout, those `fixed` elements would
// escape to the browser viewport and overlap the sidebar/topbar. The
// wrapper below applies `transform: translateZ(0)` to create a new
// containing block for fixed-positioned descendants, scoping the lib's
// UI to the wrapper's box — which is sized by the flex parent
// (SidebarInset gives us the area below the topbar and right of the
// sidebar).
//
// As a side effect this also gives us a clean rect to feed the adapter's
// `getViewportSize` so DnD hit-testing matches the visible canvas.

export default function PageScene() {
  const { sceneToken } = useParams<{ sceneToken?: string }>();
  const { user } = useSession();
  const navigate = useNavigate();

  // Mirror current user token into lib store so ownership-based gating
  // (read-only mode, save button visibility) reacts to auth changes.
  useEffect(() => {
    usePageSceneStore.getState().setCurrentUserToken(user?.user_token);
  }, [user?.user_token]);

  const navigateToImageTo3D = useCallback(() => {
    navigate("/create-image");
  }, [navigate]);

  // Track the wrapper's rendered size so the adapter's getViewportSize
  // returns the actual usable area (not window dimensions, which would
  // include sidebar + topbar).
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  const [, forceRender] = useState(0);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      sizeRef.current = { width, height };
      // Nudge a re-render so any consumer that reads sizeRef during render
      // sees the new values; the adapter itself reads through the ref.
      forceRender((n) => (n + 1) % 1024);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const getViewportSize = useCallback(() => sizeRef.current, []);

  const adapter = useWebAppPageSceneAdapter({
    userToken: user?.user_token,
    initialSceneToken: sceneToken,
    navigateToImageTo3D,
    getViewportSize,
  });

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      style={{ transform: "translateZ(0)" }}
    >
      <Stage3D adapter={adapter} sceneToken={sceneToken} />
    </div>
  );
}
