import { useState } from "react";
import { EditorProvider, useEditorAdapters } from "./EditorProvider";
import type { VideoEditorAdapters } from "./adapters";

export interface VideoEditorProps {
  projectId?: string;
  // Hosts pass a partial set of adapters; the rest fall back to the
  // bundled defaults (IndexedDB project storage, blob-URL media, etc).
  adapters?: Partial<VideoEditorAdapters> | null;
}

// Public entry. Wraps the inner shell with EditorProvider so callers
// don't have to mount the provider themselves. If the host wants to
// share one provider across multiple editor instances later, we'll
// expose a separate `<VideoEditorShell>` export.
export function VideoEditor({ projectId, adapters }: VideoEditorProps) {
  return (
    <EditorProvider adapters={adapters}>
      <VideoEditorShell projectId={projectId} />
    </EditorProvider>
  );
}

function VideoEditorShell({ projectId }: { projectId?: string }) {
  const [now] = useState(() => new Date().toISOString());
  const { authUser } = useEditorAdapters();
  const user = authUser.currentUser();

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#101014] text-white">
      <div className="max-w-md px-6 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Video Editor</h1>
        <p className="mb-1 text-sm text-white/60">
          Placeholder — the OpenCut Classic port lands here.
        </p>
        <p className="text-xs text-white/40">
          project: <span className="font-mono">{projectId ?? "(none)"}</span>
        </p>
        <p className="text-xs text-white/40">
          user: <span className="font-mono">{user?.displayName ?? "anonymous"}</span>
        </p>
        <p className="mt-4 text-xs text-white/30 font-mono">mounted at {now}</p>
      </div>
    </div>
  );
}
