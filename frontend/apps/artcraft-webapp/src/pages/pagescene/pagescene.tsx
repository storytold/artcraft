import { useCallback, useEffect, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDesktop, faHouse } from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { MediaFilesApi } from "@storyteller/api";
import { Stage3D, usePageSceneStore } from "@storyteller/ui-pagescene";
import {
  GalleryModal,
  GalleryDragComponent,
} from "@storyteller/ui-gallery-modal";
import { useSession } from "../../lib/session";
import { useStage3DCostEstimate } from "../../lib/cost-estimate-api";
import { useSidebar } from "../../components/ui/sidebar";
import { useSignupCta } from "../../components/signup-cta-modal";
import { ActiveSceneTitle } from "../../components/topbar/ActiveSceneTitle";
import { TopBarActions } from "../../components/topbar/TopBarActions";
import Seo from "../../components/seo";
import { DemoOutputOverlay } from "./demo-output-overlay";
import { OtherScenesOverlay } from "./other-scenes-overlay";
import { usePromptPrefillFromOutput } from "./use-prompt-prefill-from-output";
import { useSceneCacheStore } from "./scene-cache-store";
import { useWebAppPageSceneAdapter } from "./web-adapter";
import {
  SceneSplashModal,
  useSceneSplashAutoOpen,
  useSceneSplashLibSync,
  useSceneSplashStore,
} from "./splash";

// Mirror of the lib's private `DEFAULT_CAMERAS` in PageSceneStore.ts.
// Re-applied to the store on every scene navigation so a stale
// `cameras` array (from the previous scene) can't drive the new
// viewport's FOV when the loaded scene's JSON omits camera data — see
// the camera-reset effect below for the full mechanism.
const DEFAULT_CAMERAS = [
  {
    id: "main",
    label: "Main View",
    focalLength: 17,
    position: { x: -2.5, y: 2.5, z: 2.5 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
  {
    id: "cam2",
    label: "Camera 2",
    focalLength: 10,
    position: { x: 0, y: 0.6, z: 1.5 },
    rotation: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: 0 },
  },
];

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

// Gate the editor on mobile. The lib's layout is built around a
// 100vw-leaning 3D viewport and pointer-precision controls (right-
// click drag pan, WASD fly cam, gizmo handles), none of which work
// on touch. The conditional is at the top level so that the editor's
// heavier hooks (adapter construction, ResizeObserver, engine mount
// inside Stage3D) never run on mobile.
export default function PageScene() {
  const { isMobile } = useSidebar();
  return (
    <>
      <Seo
        title="Edit 3D - ArtCraft"
        description="Compose a 3D scene and generate AI images and videos from it."
      />
      {isMobile ? <MobileGate /> : <PageSceneEditor />}
    </>
  );
}

function PageSceneEditor() {
  const { sceneToken } = useParams<{ sceneToken?: string }>();
  const [searchParams] = useSearchParams();
  // `?image=`, `?video=`, and the legacy `?output=` / `?demo=` aliases
  // flip the editor into demo mode: the named media renders in a
  // top-right picture-in-picture card alongside the live scene. `image`
  // and `output`/`demo` are equivalent — they name the image side of
  // the preview (the legacy aliases keep existing shared links working).
  // `video` names a video token shown on the video side. When both sides
  // are present, the card adds a toggle and starts on video.
  const imageToken =
    searchParams.get("image") ||
    searchParams.get("output") ||
    searchParams.get("demo") ||
    null;
  const videoToken = searchParams.get("video") || null;
  const demoToken = imageToken || videoToken;
  const { user } = useSession();
  const navigate = useNavigate();
  const { setOpen } = useSidebar();
  const { openSignupCta } = useSignupCta();

  const didAutoCollapseRef = useRef(false);
  useEffect(() => {
    if (didAutoCollapseRef.current) return;
    setOpen(false);
    didAutoCollapseRef.current = true;
  }, [setOpen]);

  useEffect(() => {
    usePageSceneStore.getState().setCurrentUserToken(user?.user_token);
  }, [user?.user_token]);

  // Track the last scene token the user actually visited (only when a
  // real token is in the URL) so the sidebar's "Edit 3D" link can return
  // them to it on next click. Don't overwrite on the blank `/edit-3d`
  // path — that would erase the memory whenever they bounce through it.
  useEffect(() => {
    if (sceneToken) {
      useSceneCacheStore.getState().setLastVisitedSceneToken(sceneToken);
    }
  }, [sceneToken]);

  // Reset sceneMeta to defaults when entering the blank-scene path so a
  // stale title/token doesn't leak from a previously-viewed scene into
  // the header display or File menu gating. The adapter's
  // onSceneTitleChange + loadSceneViaApi paths repopulate it once a
  // scene actually loads.
  useEffect(() => {
    if (!sceneToken) {
      usePageSceneStore.getState().setSceneMeta({
        title: undefined,
        token: undefined,
        ownerToken: undefined,
        isModified: undefined,
        isInitializing: true,
      });
    }
  }, [sceneToken]);

  // Reset the lib's camera Zustand state on every scene navigation.
  // The lib's camera tickPerFrame reads `cameras` + `selectedCameraId`
  // from this module-global store every frame and applies the matched
  // entry's `focalLength` to the viewport's THREE.PerspectiveCamera
  // (CameraController.ts). save_manager only emits CamerasReplacedEvent
  // when the loaded scene_json includes a `cameras` field — older
  // saves and some demo scenes don't, so without this reset an A→B
  // handoff leaves scene A's `cameras` array (and its 60mm focal
  // length) in the store and the new viewport renders at A's FOV
  // forever. Re-seeding with the same defaults the store ships with
  // mirrors the "fresh editor" state; if B's JSON has cameras, the
  // load path replaces these immediately.
  useEffect(() => {
    usePageSceneStore.setState({
      cameras: DEFAULT_CAMERAS,
      selectedCameraId: "main",
      focalLengthDragging: { isDragging: false, focalLength: 35 },
    });
  }, [sceneToken]);

  // Mirror the URL-token scene's metadata into the lib store. Cache-hit
  // loads short-circuit the lib's loadScene path (Editor.initialize
  // prefers cacheJsonString over the sceneToken), so loadSceneViaApi —
  // the only other writer of sceneMeta.{token,ownerToken,title} — never
  // runs on a revisit. Without this, the visitor-vs-owner Save gating
  // and header title break on cache hits. Fetch independently of the
  // scene-JSON load so it's correct either way.
  useEffect(() => {
    if (!sceneToken) return;
    // Load path already populated it for this token — skip the refetch.
    if (usePageSceneStore.getState().sceneMeta.token === sceneToken) return;
    let cancelled = false;
    void new MediaFilesApi()
      .GetMediaFileByToken({ mediaFileToken: sceneToken })
      .then((meta) => {
        if (cancelled || !meta.data) return;
        usePageSceneStore.getState().setSceneMeta({
          title: meta.data.maybe_title ?? undefined,
          token: sceneToken,
          ownerToken: meta.data.maybe_creator_user?.user_token ?? undefined,
          isModified: false,
          isInitializing: false,
        });
      })
      .catch(() => {
        // Leave the store as-is; the load path may still populate it.
      });
    return () => {
      cancelled = true;
    };
  }, [sceneToken]);

  useSceneSplashAutoOpen(sceneToken);
  useSceneSplashLibSync();
  const openSceneSplash = useSceneSplashStore((s) => s.open);

  // Live-update the Generate button's credit badge as the user changes the
  // selected model, resolution, or reference images. Mirrors the cost
  // estimate UX on the create-image / create-video promptboxes.
  useStage3DCostEstimate();

  // When the URL carries `?output=<media_token>` (the demo flow used by
  // splash examples + the lightbox "Open in 3D" handoff), seed the prompt
  // box with the prompt, model, and camera aspect ratio that produced
  // that output so the user lands in a working starting point. Without a
  // `?output=`, Stage3DBody's cold-sync handles the default letterbox by
  // reading the selected model's defaultAspectRatio (now 16:9 for the
  // InstructiveEdit-tagged models that populate STAGE_3D_PAGE_MODEL_LIST).
  usePromptPrefillFromOutput(imageToken);

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
    promptSignup: openSignupCta,
    onRequestNewSceneSelector: openSceneSplash,
  });

  // Editor state survives navigating to other webapp pages: read the
  // cached serialized JSON once on mount (so re-renders don't restart
  // the engine), and store the next snapshot via the lib's
  // onSceneSerialized callback on unmount. Mirrors how Tauri stashes
  // per-tab scene JSON via useTabStore.
  //
  // Keyed by sceneToken so each scene (and the playground) gets its own
  // slot — visiting /edit-3d/A, /edit-3d/B, /edit-3d/A round-trips back
  // to A's in-progress state rather than B's or the server's. Cache
  // hits short-circuit the lib's loadScene path (Editor.initialize
  // prefers cacheJsonString over the sceneToken).
  const setCurrent = useSceneCacheStore((s) => s.setCurrent);
  const cacheJsonString = useSceneCacheStore
    .getState()
    .getEntry(sceneToken)?.current;
  const onSceneSerialized = useCallback(
    (json: string) => setCurrent(sceneToken, json),
    [sceneToken, setCurrent],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      <Stage3D
        adapter={adapter}
        sceneToken={sceneToken}
        cacheJsonString={cacheJsonString}
        onSceneSerialized={onSceneSerialized}
        showCostCalculator={false}
        showImageTo3DButton={false}
        showHelpMenu={false}
        modelSelectorPlacement="prompt-box"
        topBarStartSlot={<ActiveSceneTitle />}
        topBarEndSlot={<TopBarActions />}
        promptboxAboveStackSlot={
          <OtherScenesOverlay
            currentSceneToken={sceneToken}
            demoOutputToken={demoToken}
          />
        }
      />
      {/* Controls3D's "My Library" popup item flips the
          galleryModalVisibleViewMode signal — the modal below subscribes
          to that signal, and items inside it dispatch onto galleryDnd
          which Stage3DBody's onImageDrop handler converts into scene
          adds. Both components portal themselves out of this wrapper. */}
      <GalleryModal mode="view" />
      <GalleryDragComponent />
      {demoToken && (
        <DemoOutputOverlay imageToken={imageToken} videoToken={videoToken} />
      )}
      <SceneSplashModal currentSceneToken={sceneToken} />
    </div>
  );
}

function MobileGate() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/25 text-amber-300">
          <FontAwesomeIcon icon={faDesktop} className="text-xl" />
        </div>
        <h1 className="text-xl font-semibold text-white">
          Edit 3D is desktop-only
        </h1>
        <p className="text-sm text-white/60 leading-relaxed">
          The 3D editor needs a mouse and keyboard for camera flight, gizmo
          handles, and precision selection. Open this page on a desktop or
          laptop to start editing.
        </p>
        <Link to="/" className="mt-2">
          <Button variant="primary" icon={faHouse}>
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
