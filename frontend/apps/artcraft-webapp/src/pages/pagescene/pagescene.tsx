import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Stage3D, usePageSceneStore } from "@storyteller/ui-pagescene";
import { useSession } from "../../lib/session";
import { useSidebar } from "../../components/ui/sidebar";
import { useWebAppPageSceneAdapter } from "./web-adapter";

// Stage3D was designed for the Tauri host: its outermost div is
// `w-screen` × `calc(100vh - 68px)` and SceneContainer subtracts a
// hardcoded 56px from the adapter-supplied viewport height to leave
// room for the host's TopBar. The webapp lives inside a sidebar +
// topbar shell that already takes its slice out of the viewport, so
// this wrapper translates the lib's assumptions into webapp space:
//
//   - `overflow-hidden h-full w-full` clamps the lib's viewport-sized
//     chrome to the area SidebarInset gives us, so the inset never
//     grows a scrollbar around the editor.
//   - `getViewportSize` reads the wrapper's current rect on every call
//     and adds the lib's hardcoded 56px topbar compensation, so the
//     SceneContainer's `height - 56` math lands on the wrapper rect.
//   - The lib's `useViewportSize` only re-reads on `window` resize, so
//     a ResizeObserver here dispatches a synthetic resize whenever our
//     rect changes (sidebar collapse, peer mounts, browser resize) and
//     once on mount (the lib's `useState` initializer ran before any
//     refs were attached and saw the window-size fallback).
//   - `transform: translateZ(0)` makes this div a containing block
//     for the lib's `position: fixed` overlays so they scope here.
//
// On entry the sidebar auto-collapses on desktop to give the lib's
// 100vw-leaning layout the room it expects.

const LIB_TOP_BAR_COMPENSATION_PX = 56;

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
      height: node.clientHeight + LIB_TOP_BAR_COMPENSATION_PX,
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
      <Stage3D adapter={adapter} sceneToken={sceneToken} />
    </div>
  );
}
