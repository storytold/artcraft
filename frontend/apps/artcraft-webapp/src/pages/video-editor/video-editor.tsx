import { useParams } from "react-router-dom";
import { VideoEditor } from "@storyteller/ui-video-editor";

// Webapp host for the @storyteller/ui-video-editor lib.
//
// Phase 1: passes the route's `:projectId` straight through to the
// placeholder. Phase 2 will inject Artcraft-specific adapters here
// (gallery, media source, auth) the same way pagescene does at
// apps/artcraft-webapp/src/pages/pagescene/web-adapter.tsx.

export default function VideoEditorPage() {
  const { projectId } = useParams<{ projectId?: string }>();

  return (
    <div className="h-full w-full overflow-hidden">
      <VideoEditor projectId={projectId} />
    </div>
  );
}
