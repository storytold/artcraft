import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EditorProvider } from "./EditorProvider";
import type { VideoEditorAdapters } from "./adapters";
import { initializeGpuRenderer } from "./services/renderer/gpu-renderer";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable";
import { AssetsPanel } from "./panels/assets";
import { PropertiesPanel } from "./panels/properties";
import { Timeline } from "./timeline/components";
import { PreviewPanel } from "./preview/components";
import { EditorHeader } from "./components/editor/editor-header";
import { EditorErrorBoundary } from "./components/editor/editor-error-boundary";
import { Onboarding } from "./components/editor/onboarding";
import { MobileGate } from "./components/editor/mobile-gate";
import { usePanelStore } from "./editor/panel-store";
import { usePasteMedia } from "./media/use-paste-media";
import { useEditor } from "./editor/use-editor";
import { useEditorActions } from "./actions/use-editor-actions";
import { useKeybindingsListener } from "./actions/use-keybindings";
import { Button } from "./components/ui/button";
import { TooltipProvider } from "./components/ui/tooltip";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  createPreviewOverlayControl,
  isPreviewOverlayVisible,
  mergePreviewOverlaySources,
} from "./preview/overlays";
import { usePreviewStore } from "./preview/preview-store";
import { getGuidePreviewOverlaySource } from "./guides";
import {
  bookmarkNotesPreviewOverlay,
  getBookmarkPreviewOverlaySource,
} from "./timeline/bookmarks";

export interface VideoEditorProps {
  projectId?: string;
  // Hosts pass a partial set of adapters; the rest fall back to the
  // bundled defaults (IndexedDB project storage, blob-URL media, etc).
  adapters?: Partial<VideoEditorAdapters> | null;
  // Optional host chrome rendered in the editor header, to the right of
  // the export button. Webapp hosts that hide the global topbar inject
  // its actions (pricing/credits/task queue/profile) here.
  headerEndSlot?: ReactNode;
}

// Public entry. Wraps the inner shell with EditorProvider so callers
// don't have to mount the provider themselves. Hosts that want to share
// one provider across multiple editor instances can mount EditorProvider
// + VideoEditorShell separately.
export function VideoEditor({
  projectId: _projectId,
  adapters,
  headerEndSlot,
}: VideoEditorProps) {
  return (
    <EditorProvider adapters={adapters}>
      {/* Shell-wide Radix tooltip provider so every descendant tooltip has a
          provider ancestor regardless of which panel wraps its own. Without
          this, hosts that don't mount an app-level provider (the Tauri app)
          crash with "Tooltip must be used within TooltipProvider" the moment a
          panel renders a tooltip outside its local provider. Nested providers
          are valid in Radix. */}
      <TooltipProvider delayDuration={300}>
        <MobileGate>
          {/* Boundary contains any descendant throw — without this, an
              unhandled exception in a panel or renderer node propagates
              to the host shell and the user sees a blank app. The
              boundary's recovery button remounts the editor subtree
              (key bump); EditorCore + the host's project state stay
              alive across the recovery. */}
          <EditorErrorBoundary>
            <div className="bg-background flex h-full w-full flex-col overflow-hidden">
              <DegradedRendererBanner />
              <EditorHeader endSlot={headerEndSlot} />
              <div className="min-h-0 min-w-0 flex-1">
                <EditorLayout />
              </div>
              <Onboarding />
            </div>
          </EditorErrorBoundary>
        </MobileGate>
      </TooltipProvider>
    </EditorProvider>
  );
}

function DegradedRendererBanner() {
  const isDegraded = useEditor((e) => e.renderer.isDegraded);
  const [dismissed, setDismissed] = useState(false);
  if (!isDegraded || dismissed) return null;

  return (
    <div className="bg-accent border-b h-9 flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span>For the best experience, open this editor in Chrome.</span>
      <Button
        variant="text"
        size="icon"
        className="p-0 w-auto [&_svg]:size-3.5"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        <HugeiconsIcon icon={Cancel01Icon} />
      </Button>
    </div>
  );
}

function EditorLayout() {
  // Boot the wasm-backed GPU compositor and gate the panel render on
  // it. We need to *await* init before <PreviewCanvas> mounts —
  // child useEffects fire bottom-up, so kicking GPU off in a sibling
  // useEffect lets PreviewCanvas race ahead and panic with
  // "GPU context not initialized" the moment opencut-wasm's
  // initCompositor runs. initializeGpuRenderer is idempotent and
  // catches WebGPU failures internally, so the gate eventually opens
  // even on hardware without WebGPU (rendering falls back via
  // RendererManager.isDegraded).
  //
  // The actions / keybindings / paste-media listeners live in
  // ReadyEditorLayout below so they only attach once both gates are
  // open; before then, a Space/Delete keypress or a media paste would
  // dispatch against an editor whose preview canvas hasn't mounted.
  const [gpuReady, setGpuReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void initializeGpuRenderer().then(() => {
      if (!cancelled) setGpuReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Also gate on the host having bootstrapped a project. Panels read
  // editor.scenes.getActiveScene() / editor.project.getActive() on
  // mount; without a project they crash with "No active scene". Hosts
  // can bootstrap via setActiveProject at any time — this gate flips
  // as soon as they do. Avoids the historical pattern of hosts having
  // to render <VideoEditor> conditionally on their own ready state.
  const hasProject = useEditor(
    (editor) => editor.project.getActive() !== null,
  );

  if (!gpuReady || !hasProject) return null;
  return <ReadyEditorLayout />;
}

function ReadyEditorLayout() {
  useEditorActions();
  useKeybindingsListener();
  usePasteMedia();
  const { panels, setPanel } = usePanelStore();
  const activeScene = useEditor((editor) =>
    editor.scenes.getActiveSceneOrNull(),
  );
  const currentTime = useEditor((editor) => editor.playback.getCurrentTime());
  const activeGuide = usePreviewStore((state) => state.activeGuide);
  const overlays = usePreviewStore((state) => state.overlays);
  const setOverlayVisibility = usePreviewStore(
    (state) => state.setOverlayVisibility,
  );
  const showBookmarkNotes = isPreviewOverlayVisible({
    overlay: bookmarkNotesPreviewOverlay,
    overlays,
  });

  const overlaySource = useMemo(
    () =>
      mergePreviewOverlaySources({
        sources: [
          getGuidePreviewOverlaySource({
            guideId: activeGuide,
          }),
          activeScene
            ? getBookmarkPreviewOverlaySource({
                bookmarks: activeScene.bookmarks,
                time: currentTime,
                isVisible: showBookmarkNotes,
              })
            : {
                definitions: [bookmarkNotesPreviewOverlay],
                instances: [],
              },
        ],
      }),
    [activeGuide, activeScene, currentTime, showBookmarkNotes],
  );

  const overlayControls = useMemo(
    () =>
      overlaySource.definitions.map((overlay) =>
        createPreviewOverlayControl({ overlay, overlays }),
      ),
    [overlaySource.definitions, overlays],
  );

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="size-full gap-[0.18rem]"
      onLayout={(sizes) => {
        setPanel({
          panel: "mainContent",
          size: sizes[0] ?? panels.mainContent,
        });
        setPanel({
          panel: "timeline",
          size: sizes[1] ?? panels.timeline,
        });
      }}
    >
      <ResizablePanel
        defaultSize={panels.mainContent}
        minSize={30}
        maxSize={85}
        className="min-h-0"
      >
        <ResizablePanelGroup
          direction="horizontal"
          className="size-full gap-[0.19rem] px-3"
          onLayout={(sizes) => {
            setPanel({ panel: "tools", size: sizes[0] ?? panels.tools });
            setPanel({ panel: "preview", size: sizes[1] ?? panels.preview });
            setPanel({
              panel: "properties",
              size: sizes[2] ?? panels.properties,
            });
          }}
        >
          <ResizablePanel
            defaultSize={panels.tools}
            minSize={15}
            maxSize={40}
            className="min-w-0"
          >
            <AssetsPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={panels.preview}
            minSize={30}
            className="min-h-0 min-w-0 flex-1"
          >
            <PreviewPanel
              overlayControls={overlayControls}
              overlayInstances={overlaySource.instances}
              onOverlayVisibilityChange={setOverlayVisibility}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel
            defaultSize={panels.properties}
            minSize={15}
            maxSize={40}
            className="min-w-0"
          >
            <PropertiesPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel
        defaultSize={panels.timeline}
        minSize={15}
        maxSize={70}
        className="min-h-0 px-3 pb-3"
      >
        <Timeline />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
