// GlobalFileDropHandler: lets the user drop a file anywhere on the app window to start an upload.
// Mounted once, near the root, in app/src/index.tsx so it is active on every page.
// Depending on the file type (.glb 3D model, .png/.jpg/.jpeg image, .spz splat) it opens the matching
// upload modal from @storyteller/ui-upload-modal with the dropped files pre-filled.
// Inside the Tauri desktop shell the drop comes from the native window (file paths), in a plain browser
// (dev mode) it comes from normal HTML5 drag events (File objects).

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { BoxIcon, ImagesIcon, Maximize2Icon } from "lucide-react";
import {
  UploadModal3D,
  UploadModalImage,
  UploadModalSplat,
} from "@storyteller/ui-upload-modal";
import { isPromptBoxDropZoneActive } from "@storyteller/ui-promptbox";

// Which upload modal to show: a 3D model, an image, a Gaussian splat, or none (null = closed).
type ModalType = "3d" | "image" | "splat" | null;

/**
 * Picks the upload modal for a file by its extension (case-insensitive).
 * Returns null when the extension is not supported, so the caller can ignore the file.
 */
function getModalTypeForFileName(name: string): ModalType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "glb") return "3d";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "image";
  if (ext === "spz") return "splat";
  return null;
}

/**
 * True when some Radix dialog (modal) is already on screen.
 * Radix marks every dialog body with a data-radix-dialog-content attribute, so we look for that in the DOM.
 */
function isAnyModalOpen(): boolean {
  return !!document.querySelector("[data-radix-dialog-content]");
}

/**
 * Whole-app drops stand down while a prompt box owns them. On the create
 * pages the prompt box is the only drop target (matching the webapp), so a
 * drop anywhere else must do nothing rather than open the upload modal.
 */
function isGlobalDropSuppressed(): boolean {
  return isAnyModalOpen() || isPromptBoxDropZoneActive();
}

// True when running inside the Tauri desktop shell (Tauri injects window.__TAURI__); false in a normal browser.
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

/**
 * Invisible app-wide drop target plus the three upload modals it can open.
 * Renders a "Drop to Upload" overlay while a file is dragged over the window, and the upload modals
 * (always mounted, shown through isOpen). Takes no props.
 */
export function GlobalFileDropHandler() {
  // Counts nested dragenter/dragleave events in the browser path. A ref (not state) because it is only
  // bookkeeping read inside event handlers and must not trigger re-renders; the overlay hides at 0.
  const dragCounter = useRef(0);
  // True while a file is being dragged over the window (controls the overlay).
  const [isDragging, setIsDragging] = useState(false);
  // Which upload modal is open right now (null = none).
  const [modalType, setModalType] = useState<ModalType>(null);
  // The dropped files handed to the open modal as initialFiles.
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Close whichever modal is open and forget the dropped files.
  const closeModal = () => {
    setModalType(null);
    setPendingFiles([]);
  };

  // Runs once on mount: registers the drag/drop listeners and removes them on unmount.
  // Two paths: native Tauri drag-drop events (desktop app) or HTML5 window events (browser dev mode).
  useEffect(() => {
    if (isTauri) {
      const unlisteners: Array<() => void> = [];
      // FIX: setup() is async, so cleanup can run BEFORE the native subscription is handed back (React
      // StrictMode does exactly that in dev: mount, cleanup, mount). The cleanup then had nothing to
      // unlisten and the first subscription leaked, so every drop was handled twice. This flag lets setup
      // notice it was cancelled and drop its own subscription.
      let cancelled = false;

      // Tauri window APIs are imported lazily so the browser build never loads them. setup is async because
      // subscribing to the native event returns a promise; the unlisten function is stored for cleanup.
      const setup = async () => {
        try {
          const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
          const { convertFileSrc } = await import("@tauri-apps/api/core");
          if (cancelled) return;
          const appWindow = getCurrentWebviewWindow();

          // Native drag-drop events: enter / over / drop (leave and cancel fall through to the final else).
          // Native events carry file PATHS, not File objects, so dropped files are read back below.
          const unlisten = await appWindow.onDragDropEvent(async (event) => {
            const payload = event.payload;

            if (payload.type === "enter") {
              if (!isGlobalDropSuppressed()) setIsDragging(true);
            } else if (payload.type === "over") {
              // The prompt box can mount mid-drag (or the pointer can move
              // onto it), so keep re-checking rather than trusting "enter".
              if (isGlobalDropSuppressed()) setIsDragging(false);
            } else if (payload.type === "drop") {
              setIsDragging(false);
              if (isGlobalDropSuppressed()) return;

              if (payload.paths.length === 0) return;

              // Find first path with a recognised extension
              let modalKind: ModalType = null;
              for (const p of payload.paths) {
                modalKind = getModalTypeForFileName(p.split(/[/\\]/).pop() ?? "");
                if (modalKind) break;
              }
              if (!modalKind) return;

              // Keep only paths matching the detected modal type
              const matchingPaths = payload.paths.filter((p) => {
                const name = p.split(/[/\\]/).pop() ?? "";
                return getModalTypeForFileName(name) === modalKind;
              });

              const skippedCount = payload.paths.length - matchingPaths.length;
              if (skippedCount > 0) {
                toast(
                  `${skippedCount} file${skippedCount > 1 ? "s" : ""} skipped — unsupported or mixed types`,
                  { icon: "⚠️" }
                );
              }

              try {
                // Turn each dropped path into a File: convertFileSrc makes a URL the webview may fetch,
                // then the bytes are read into a Blob and wrapped as a File named after the original.
                const files = await Promise.all(
                  matchingPaths.map(async (path) => {
                    const fileName = path.split(/[/\\]/).pop() ?? "file";
                    const assetUrl = convertFileSrc(path);
                    const response = await fetch(assetUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    return new File([blob], fileName);
                  })
                );
                // Bring the app window to the front so the modal is visible after dragging from another app.
                await appWindow.setFocus();
                setModalType(modalKind);
                setPendingFiles(files);
              } catch (err) {
                console.error("[DragDrop] file read failed:", err);
              }
            } else {
              setIsDragging(false);
            }
          });

          // FIX: cleanup already ran while we were awaiting, so nobody will ever call this later; do it now.
          if (cancelled) {
            unlisten();
            return;
          }
          unlisteners.push(unlisten);
        } catch (err) {
          console.error("[DragDrop] setup failed:", err);
        }
      };

      setup();
      return () => {
        cancelled = true;
        unlisteners.forEach((fn) => fn());
      };

    } else {
      // HTML5 path (browser dev mode)
      // dragenter/dragleave fire for every child element the pointer crosses, hence the counter.
      const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        if (!e.dataTransfer?.types.includes("Files")) return;
        if (isGlobalDropSuppressed()) return;
        dragCounter.current++;
        setIsDragging(true);
      };
      const handleDragLeave = (e: DragEvent) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        dragCounter.current--;
        if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
      };
      // preventDefault on dragover is required by the browser, otherwise the drop event never fires.
      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      };
      const handleDrop = (e: DragEvent) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        e.preventDefault();
        setIsDragging(false);
        dragCounter.current = 0;
        if (isGlobalDropSuppressed()) return;

        const allFiles = Array.from(e.dataTransfer.files);
        if (allFiles.length === 0) return;

        // Find first file with a recognised extension
        let modalKind: ModalType = null;
        for (const f of allFiles) {
          modalKind = getModalTypeForFileName(f.name);
          if (modalKind) break;
        }
        if (!modalKind) return;

        // Keep only files matching the detected modal type
        const matchingFiles = allFiles.filter(
          (f) => getModalTypeForFileName(f.name) === modalKind
        );

        const skippedCount = allFiles.length - matchingFiles.length;
        if (skippedCount > 0) {
          toast(
            `${skippedCount} file${skippedCount > 1 ? "s" : ""} skipped — unsupported or mixed types`,
            { icon: "⚠️" }
          );
        }

        setModalType(modalKind);
        setPendingFiles(matchingFiles);
      };
      window.addEventListener("dragenter", handleDragEnter);
      window.addEventListener("dragleave", handleDragLeave);
      window.addEventListener("dragover", handleDragOver);
      window.addEventListener("drop", handleDrop);
      return () => {
        window.removeEventListener("dragenter", handleDragEnter);
        window.removeEventListener("dragleave", handleDragLeave);
        window.removeEventListener("dragover", handleDragOver);
        window.removeEventListener("drop", handleDrop);
      };
    }
  }, []);

  // Overlay shown while dragging (and no modal open), then the three upload modals; only one is open at a time.
  return (
    <>
      {isDragging && modalType === null && (
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-3 border border-dashed border-white/60 bg-ui-panel px-16 py-12 text-white">
            <Maximize2Icon className="text-3xl opacity-60" />
            <div className="font-display text-2xl tracking-tight">Drop to Upload</div>
            <div className="hud-label text-white/50">GLB, PNG, JPG, JPEG, SPZ</div>
          </div>
        </div>
      )}
      <UploadModal3D
        isOpen={modalType === "3d"}
        initialFiles={pendingFiles.length > 0 ? pendingFiles : undefined}
        onClose={closeModal}
        onSuccess={() => closeModal()}
        title="Upload a 3D Model"
        titleIcon={BoxIcon}
      />
      <UploadModalImage
        isOpen={modalType === "image"}
        initialFiles={pendingFiles.length > 0 ? pendingFiles : undefined}
        onClose={closeModal}
        onSuccess={() => closeModal()}
        title="Upload an Image"
        titleIcon={ImagesIcon}
      />
      <UploadModalSplat
        isOpen={modalType === "splat"}
        initialFiles={pendingFiles.length > 0 ? pendingFiles : undefined}
        onClose={closeModal}
        onSuccess={() => {}}
        title="Upload a Splat"
        titleIcon={BoxIcon}
      />
    </>
  );
}
