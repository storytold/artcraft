import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import {
  VideoEditor,
  EditorCore,
  buildDefaultScene,
  createDefaultAdapters,
  ZERO_MEDIA_TIME,
  type TProject,
  type VideoEditorAdapters,
} from "@storyteller/ui-video-editor";
import { webappToastAdapter } from "./adapters/toast-adapter";
import { webappAuthUserAdapter } from "./adapters/auth-user-adapter";
import { webappMediaSourceAdapter } from "./adapters/media-source-adapter";
import { webappExportSinkAdapter } from "./adapters/export-sink-adapter";
import { useWebappAssetGalleryAdapter } from "./adapters/asset-gallery-adapter";
import {
  createWebappProjectStorage,
  isLocalProjectId,
  makeLocalProjectId,
} from "./adapters/project-storage-adapter";
import { VideoEditorProjectsLanding } from "./VideoEditorProjectsLanding";
import { TopBarActions } from "../../components/topbar/TopBarActions";

// Webapp host for the @storyteller/ui-video-editor lib.
//
// Routing:
//   /video-editor                → saved-projects landing (list + new)
//   /video-editor/local-{uuid}   → fresh in-memory project; the first
//                                  autosave creates the server row and
//                                  rewrites the URL to the token
//   /video-editor/{token}        → load the project document from the
//                                  server (ProjectsApi / video_timeline)
//
// Persistence goes through createWebappProjectStorage; the remaining
// adapters route uploads/gallery/toasts/session through the webapp.

function buildBootstrapProject({ id }: { id: string }): TProject {
  const scene = buildDefaultScene({ name: "Main scene", isMain: true });
  const now = new Date();
  return {
    metadata: {
      id,
      name: "Untitled project",
      duration: ZERO_MEDIA_TIME,
      createdAt: now,
      updatedAt: now,
    },
    scenes: [scene],
    currentSceneId: scene.id,
    settings: {
      fps: { numerator: 30, denominator: 1 } as never,
      canvasSize: { width: 1920, height: 1080 },
      background: { type: "color", color: "#000000" },
    },
    version: 1,
  };
}

export default function VideoEditorPage() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const { adapter: assetGalleryAdapter, modal: galleryModal } =
    useWebappAssetGalleryAdapter();

  const projectStorage = useMemo(
    () =>
      createWebappProjectStorage({
        onProjectCreated: ({ localId, token }) => {
          // First save of a fresh project: re-key the active project to
          // the server token, then swap the URL. The session effect's
          // "active id already matches the route" check makes the
          // navigation a no-op instead of a re-bootstrap.
          const editor = EditorCore.getInstance();
          const active = editor.project.getActive();
          if (
            active &&
            isLocalProjectId(active.metadata.id) &&
            active.metadata.id === localId
          ) {
            editor.project.setActiveProject({
              project: {
                ...active,
                metadata: { ...active.metadata, id: token },
              },
            });
          }
          // Only rewrite the URL if the user is still on this project's
          // route — a teardown flush can finish after they navigated
          // elsewhere, and yanking them back into the editor would be
          // hostile. The landing lists the project either way.
          if (window.location.pathname === `/video-editor/${localId}`) {
            navigateRef.current(`/video-editor/${token}`, { replace: true });
          }
        },
      }),
    [],
  );

  const adapters = useMemo<Partial<VideoEditorAdapters>>(
    () => ({
      toast: webappToastAdapter,
      authUser: webappAuthUserAdapter,
      mediaSource: webappMediaSourceAdapter,
      assetGallery: assetGalleryAdapter,
      exportSink: webappExportSinkAdapter,
      projectStorage,
    }),
    [assetGalleryAdapter, projectStorage],
  );

  if (!projectId) {
    return (
      <VideoEditorProjectsLanding
        projectStorage={projectStorage}
        onNewProject={() => navigate(`/video-editor/${makeLocalProjectId()}`)}
        onOpenProject={(token) => navigate(`/video-editor/${token}`)}
      />
    );
  }

  return (
    <VideoEditorSession
      key={projectId}
      projectId={projectId}
      adapters={adapters}
      galleryModal={galleryModal}
    />
  );
}

function VideoEditorSession({
  projectId,
  adapters,
  galleryModal,
}: {
  projectId: string;
  adapters: Partial<VideoEditorAdapters>;
  galleryModal: ReactNode;
}) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "ready" | "missing">(
    "pending",
  );

  useEffect(() => {
    // Explicit initialize ensures the webapp adapters are installed
    // before getInstance() lazy-creates with defaults. EditorProvider's
    // own initialize call (later, when <VideoEditor> mounts) is a no-op
    // because the instance now exists with our adapter bundle.
    EditorCore.initialize({
      adapters: { ...createDefaultAdapters(), ...adapters },
    });
    const editor = EditorCore.getInstance();

    let cancelled = false;

    // Already active (StrictMode remount, or the post-first-save URL
    // rewrite from local id to token): nothing to do.
    if (editor.project.getActive()?.metadata.id === projectId) {
      setStatus("ready");
    } else if (isLocalProjectId(projectId)) {
      // Tear down whatever project was open before bootstrapping — this
      // path is reachable without the header's exit flow (Back button,
      // "New project"), and a leftover media bin or undo stack would
      // bleed into the fresh project and persist on its first save.
      editor.project.closeProject();
      const project = buildBootstrapProject({ id: projectId });
      editor.project.setActiveProject({ project });
      editor.scenes.initializeScenes({
        scenes: project.scenes,
        currentSceneId: project.currentSceneId,
      });
      // closeProject stopped the autosave subscriptions; re-arm them.
      editor.save.start();
      setStatus("ready");
    } else {
      setStatus("pending");
      // openProject performs its own full teardown of any prior project.
      editor.project
        .openProject({ id: projectId })
        .then((project) => {
          if (!cancelled) setStatus(project ? "ready" : "missing");
        })
        .catch((error) => {
          console.error("Failed to open project:", projectId, error);
          if (!cancelled) setStatus("missing");
        });
    }

    return () => {
      cancelled = true;
    };
  }, [projectId, adapters]);

  // Teardown is keyed on projectId alone so it fires exactly once, on
  // true unmount (key={projectId} remounts the component per project) —
  // never on an incidental adapter identity change mid-session.
  useEffect(() => {
    return () => teardownEditorSession(projectId);
  }, [projectId]);

  if (status === "missing") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="text-lg font-medium">Couldn't open this project</div>
        <p className="max-w-sm text-center text-sm opacity-60">
          It may have been deleted, or it belongs to another account.
        </p>
        <button
          onClick={() => navigate("/video-editor")}
          className="border border-white/15 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/10"
        >
          Back to projects
        </button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex h-full w-full items-center justify-center gap-3">
        <LoadingSpinner />
        <span className="font-medium opacity-70">Loading project...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <VideoEditor
        projectId={projectId}
        adapters={adapters}
        headerEndSlot={<TopBarActions />}
        exitTo="/video-editor"
      />
      {galleryModal}
    </div>
  );
}

// Unmount teardown for a session. EditorCore is a singleton, so leaving the
// route (sidebar link, Back button) without this would keep the project
// active with live autosave subscriptions — a stale debounce could fire a
// server write long after the user left, and the next session would open on
// top of leaked state.
//
// Ordering matters: saveCurrentProject serializes the document synchronously
// (before its first await), so pending edits are captured even though
// closeProject clears the editor immediately after — the upload continues in
// the background against the captured snapshot. Skipped when nothing is
// dirty so an untouched bootstrap project never creates an empty server row.
function teardownEditorSession(projectId: string): void {
  const editor = EditorCore.getInstance();
  if (editor.project.getActive()?.metadata.id !== projectId) {
    // Another session (different :projectId key) already took over the
    // singleton — it owns teardown now.
    return;
  }
  if (editor.save.getIsDirty()) {
    editor.project.saveCurrentProject().catch((error) => {
      console.error("Final save on editor exit failed:", error);
    });
  }
  editor.project.closeProject();
}
