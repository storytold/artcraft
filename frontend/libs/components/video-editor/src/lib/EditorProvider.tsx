import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { VideoEditorAdapters } from "./adapters";
import { createDefaultAdapters } from "./adapters/default";
import { EditorCore } from "./core";

// Internal context. Components inside the editor read adapters via
// `useEditorAdapters()` rather than threading them through props.
const Ctx = createContext<VideoEditorAdapters | null>(null);

export interface EditorProviderProps {
  // Pass `null` (or omit) to use the bundled defaults — useful for
  // the lib's standalone smoke test. Hosts that want real Artcraft
  // adapters pass a partial bundle; defaults fill in the rest.
  adapters?: Partial<VideoEditorAdapters> | null;
  children: ReactNode;
}

export function EditorProvider({ adapters, children }: EditorProviderProps) {
  // Defaults instantiated once per provider mount. Re-evaluating on
  // every render would churn IndexedDB connections and blob URLs.
  const resolved = useMemo<VideoEditorAdapters>(() => {
    const defaults = createDefaultAdapters();
    if (!adapters) return defaults;
    return { ...defaults, ...adapters };
  }, [adapters]);

  // Bootstrap EditorCore with the resolved adapter bundle. Commands
  // and managers read `EditorCore.getInstance().adapters.X` after
  // this. Re-initializing on adapter changes resets the singleton —
  // hosts that need hot-swap behavior should remount.
  useMemo(() => {
    EditorCore.initialize({ adapters: resolved });
  }, [resolved]);

  return <Ctx.Provider value={resolved}>{children}</Ctx.Provider>;
}

export function useEditorAdapters(): VideoEditorAdapters {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useEditorAdapters must be used inside <EditorProvider>. " +
        "Mount your <VideoEditor> below an <EditorProvider>.",
    );
  }
  return ctx;
}
