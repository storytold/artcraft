import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  VideoEditor,
  EditorCore,
  buildDefaultScene,
  ZERO_MEDIA_TIME,
  type TProject,
} from "@storyteller/ui-video-editor";

// Webapp host for the @storyteller/ui-video-editor lib.
//
// Phase 1: bootstraps a default in-memory project so the editor shell
// can mount with an active scene. Phase 2 will inject Artcraft-specific
// adapters here (gallery, media source, auth) the same way pagescene
// does at apps/artcraft-webapp/src/pages/pagescene/web-adapter.tsx, and
// will load real projects via the ProjectStorageAdapter.

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

  useEffect(() => {
    const editor = EditorCore.getInstance();
    const project = buildBootstrapProject({
      id: projectId ?? `local-${Date.now()}`,
    });
    editor.project.setActiveProject({ project });
    editor.scenes.initializeScenes({
      scenes: project.scenes,
      currentSceneId: project.currentSceneId,
    });
    setReady(true);
  }, [projectId]);

  if (!ready) return null;

  return (
    <div className="h-full w-full overflow-hidden">
      <VideoEditor projectId={projectId} />
    </div>
  );
}
