import { useEffect, useCallback } from "react";
import { VideoEditorCore } from "./core/EditorCore";
import { useVideoEditor } from "./hooks/useVideoEditor";
import { useEditorUIStore } from "./stores/editor-store";

import { PreviewPanel } from "./components/preview/PreviewPanel";
import { TimelinePanel } from "./components/timeline/TimelinePanel";
import { AssetsPanel } from "./components/assets/AssetsPanel";
import { PropertiesPanel } from "./components/properties/PropertiesPanel";

export default function PageVideoEditor() {
  const editor = useVideoEditor();
  const { isInitializing, setInitializing } = useEditorUIStore();

  // Initialize on mount
  useEffect(() => {
    editor.project.createDefault();
    setInitializing(false);

    return () => {
      VideoEditorCore.reset();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Space — play/pause
      if (e.code === "Space") {
        e.preventDefault();
        editor.playback.toggle();
        return;
      }

      // Ctrl+Z — undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        editor.command.undo();
        return;
      }

      // Ctrl+Shift+Z — redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        editor.command.redo();
        return;
      }

      // Delete / Backspace — delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = editor.selection.getSelectedElements();
        if (selected.length > 0) {
          e.preventDefault();
          editor.timeline.deleteElements({ elements: selected });
          editor.selection.clearSelection();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  // Gallery drop listener
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.item) return;
      // Will handle gallery drops in future integration
      console.log("Gallery drop in video editor:", detail);
    };
    window.addEventListener("gallery-video-editor-drop", handler);
    return () =>
      window.removeEventListener("gallery-video-editor-drop", handler);
  }, []);

  if (isInitializing) return null;

  return (
    <div className="flex h-[calc(100vh-56px)] w-screen flex-col bg-ui-background pt-[56px]">
      {/* Top: Assets + Preview + Properties */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AssetsPanel />
        <PreviewPanel />
        <PropertiesPanel />
      </div>

      {/* Bottom: Timeline */}
      <div className="h-[280px] shrink-0 border-t border-ui-panel-border bg-ui-panel">
        <TimelinePanel />
      </div>
    </div>
  );
}
