import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
import { TopBarActions } from "../../components/topbar/TopBarActions";

// Webapp host for the @storyteller/ui-video-editor lib.
//
// Bootstraps a default in-memory project so the editor shell can mount
// with an active scene (replace with a real load via
// ProjectStorageAdapter once the backend exists), and injects the
// webapp adapters that route through Artcraft's MediaUploadApi /
// MediaFilesApi / gallery modal / session store / toast event bus.

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
  const [ready, setReady] = useState(false);

  const { adapter: assetGalleryAdapter, modal: galleryModal } =
    useWebappAssetGalleryAdapter();

  const adapters = useMemo<Partial<VideoEditorAdapters>>(
    () => ({
      toast: webappToastAdapter,
      authUser: webappAuthUserAdapter,
      mediaSource: webappMediaSourceAdapter,
      assetGallery: assetGalleryAdapter,
      exportSink: webappExportSinkAdapter,
    }),
    [assetGalleryAdapter],
  );

  // Stable transient id for the "no projectId in route" case. Computed
  // once on first mount and reused across StrictMode double-mount,
  // adapter ref churn, and any other dep change so we never overwrite
  // the in-memory project with a fresh bootstrap.
  const transientIdRef = useRef<string>(`local-${crypto.randomUUID()}`);
  const resolvedProjectId = projectId ?? transientIdRef.current;

  useEffect(() => {
    // Explicit initialize ensures the webapp adapters are installed
    // before getInstance() lazy-creates with defaults. EditorProvider's
    // own initialize call (later, when <VideoEditor> mounts) is a no-op
    // because the instance now exists with our adapter bundle.
    EditorCore.initialize({
      adapters: { ...createDefaultAdapters(), ...adapters },
    });
    const editor = EditorCore.getInstance();

    // Bootstrap only when the active project doesn't already match the
    // requested id. StrictMode mount → unmount → re-mount with the same
    // id is a no-op; a route nav to a different :projectId reloads.
    if (editor.project.getActive()?.metadata.id !== resolvedProjectId) {
      const project = buildBootstrapProject({ id: resolvedProjectId });
      editor.project.setActiveProject({ project });
      editor.scenes.initializeScenes({
        scenes: project.scenes,
        currentSceneId: project.currentSceneId,
      });
    }
    setReady(true);
  }, [resolvedProjectId, adapters]);

  if (!ready) return null;

  return (
    <div className="h-full w-full overflow-hidden">
      <VideoEditor
        projectId={projectId}
        adapters={adapters}
        headerEndSlot={<TopBarActions />}
      />
      {galleryModal}
    </div>
  );
}
