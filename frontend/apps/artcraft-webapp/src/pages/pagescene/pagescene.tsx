import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Stage3D, usePageSceneStore } from "@storyteller/ui-pagescene";
import { useSession } from "../../lib/session";
import { useSidebar } from "../../components/ui/sidebar";
import { useWebAppPageSceneAdapter } from "./web-adapter";

// Stage3D fills its parent box; this wrapper is that box. It clamps
// the editor to the SidebarInset area and feeds the lib its rect:
//
//   - `overflow-hidden h-full w-full` sizes Stage3D to the inset and
//     prevents the inset from growing a scrollbar around the editor.
//   - `getViewportSize` reports the wrapper's current rect. Consumers
//     in the lib (getScale, absolute-positioned chrome) read it via
//     `useViewportSize`.
//   - The lib's `useViewportSize` only re-reads on `window` resize, so
//     a ResizeObserver here dispatches a synthetic resize whenever our
//     rect changes (sidebar collapse, browser resize).
//   - `transform: translateZ(0)` makes this div a containing block
//     for the lib's `position: fixed` overlays so they scope here.
//
// On entry the sidebar auto-collapses on desktop to give the lib's
// 100vw-leaning layout the room it expects.

export default function PageScene() {
  const { sceneToken } = useParams<{ sceneToken?: string }>();
  const { user } = useSession();
  const navigate = useNavigate();
  const { setOpen, isMobile } = useSidebar();

  const didAutoCollapseRef = useRef(false);
  useEffect(() => {
    if (didAutoCollapseRef.current) return;
    if (isMobile) return;
    setOpen(false);
    didAutoCollapseRef.current = true;
  }, [isMobile, setOpen]);

  useEffect(() => {
    usePageSceneStore.getState().setCurrentUserToken(user?.user_token);
  }, [user?.user_token]);

  const navigateToImageTo3D = useCallback(() => {
    navigate("/create-image");
  }, [navigate]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const kick = () => window.dispatchEvent(new Event("resize"));
    const observer = new ResizeObserver(kick);
    observer.observe(node);
    // One-shot mount kick: the lib's useState ran before refs were
    // attached, so it read the window-size fallback. This re-fires its
    // listener now that the wrapper rect is measurable.
    kick();
    return () => observer.disconnect();
  }, []);

  const getViewportSize = useCallback(() => {
    const node = wrapperRef.current;
    if (!node) {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return {
      width: node.clientWidth,
      height: node.clientHeight,
    };
  }, []);

  const adapter = useWebAppPageSceneAdapter({
    userToken: user?.user_token,
    initialSceneToken: sceneToken,
    navigateToImageTo3D,
    getViewportSize,
  });

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      <Stage3D
        adapter={adapter}
        sceneToken={sceneToken}
        showCostCalculator={false}
        showImageTo3DButton={false}
      />
    </div>
  );
}
