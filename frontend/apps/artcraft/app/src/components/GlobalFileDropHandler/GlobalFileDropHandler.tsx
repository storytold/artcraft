import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { faCube, faImages, faUpRightAndDownLeftFromCenter } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  UploadModal3D,
  UploadModalImage,
  UploadModalSplat,
} from "@storyteller/ui-upload-modal";
import {
  dndCoordinator,
  mediaKindFromFile,
  mediaKindFromFileName,
  mediaKindFromMime,
  DND_Z,
  type MediaKind,
} from "@storyteller/ui-dnd";
import { FilterEngineCategories } from "../../enums";

type ModalType = "3d" | "image" | "splat" | null;

// Plural noun for reject toasts ("… doesn't accept videos.").
function kindNoun(kind: MediaKind): string {
  switch (kind) {
    case "image":
      return "images";
    case "video":
      return "videos";
    case "audio":
      return "audio";
    case "model3d":
      return "3D models";
    case "splat":
      return "splats";
  }
}

function getModalTypeForFileName(name: string): ModalType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "glb") return "3d";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "image";
  if (ext === "spz") return "splat";
  return null;
}

function isAnyModalOpen(): boolean {
  return !!document.querySelector("[data-radix-dialog-content]");
}

const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// Unified file drag-and-drop entry point for the desktop app.
//
// External OS files are first offered to the unified drop-target registry: if
// the cursor is over a typed field (e.g. an image-reference slot), the file is
// routed straight there. The full-screen "Drop to Upload" overlay is only a
// CATCH-ALL — it appears while dragging over empty space, never the instant a
// file enters the window, so it can't block field targeting.
export function GlobalFileDropHandler() {
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const closeModal = () => {
    setModalType(null);
    setPendingFiles([]);
  };

  // Show a toast when a drag is released over a field that can't accept its
  // media kind (e.g. a video dropped on an image-reference slot). Covers both
  // gallery drags and OS-file drags, since both route through the coordinator.
  useEffect(() => {
    dndCoordinator.setRejectHandler((payload, targetLabel) => {
      toast.error(`${targetLabel ?? "This field"} doesn't accept ${kindNoun(payload.kind)}.`);
    });
    return () => dndCoordinator.setRejectHandler(null);
  }, []);

  useEffect(() => {
    if (isTauri) {
      const unlisteners: Array<() => void> = [];
      // Media kind of the first recognized path, captured on "enter" — the Tauri
      // "over" event carries only a position (no paths), so we must remember it.
      let candidateKind: ReturnType<typeof mediaKindFromFileName> = null;

      const setup = async () => {
        try {
          const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
          const { convertFileSrc } = await import("@tauri-apps/api/core");
          const appWindow = getCurrentWebviewWindow();

          const fetchFileFromPath = async (path: string, fileName: string) => {
            const assetUrl = convertFileSrc(path);
            const response = await fetch(assetUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            return new File([blob], fileName);
          };

          // Physical → CSS pixels. DPR can differ per monitor, so read it fresh.
          const toCss = (pos: { x: number; y: number }) => {
            const dpr = window.devicePixelRatio || 1;
            return { x: pos.x / dpr, y: pos.y / dpr };
          };

          const unlisten = await appWindow.onDragDropEvent(async (event) => {
            const payload = event.payload;

            if (payload.type === "enter") {
              candidateKind = null;
              for (const path of payload.paths) {
                const name = path.split(/[/\\]/).pop() ?? "";
                const kind = mediaKindFromFileName(name);
                if (kind) {
                  candidateKind = kind;
                  // Begin a registry drag so fields can highlight on "over".
                  // The File is fetched lazily only if a target accepts it.
                  dndCoordinator.beginDrag({
                    source: "os-file",
                    kind,
                    fileName: name,
                    getFile: () => fetchFileFromPath(path, name),
                  });
                  break;
                }
              }
            } else if (payload.type === "over") {
              const { x, y } = toCss(payload.position);
              if (candidateKind) {
                const { target } = dndCoordinator.updateHover(x, y);
                // Catch-all overlay only when not over a field (and no modal).
                setIsDragging(!target && !isAnyModalOpen());
              } else {
                dndCoordinator.updateHover(-1, -1);
                setIsDragging(!isAnyModalOpen());
              }
            } else if (payload.type === "drop") {
              setIsDragging(false);
              const { x, y } = toCss(payload.position);

              // Try the registry first — routes to a field or rejects a mismatch.
              const handled = await dndCoordinator.drop(x, y);
              dndCoordinator.endDrag();
              candidateKind = null;
              if (handled) return;

              // Catch-all fallback: the original upload-modal routing. Suppressed
              // while a modal is open so a stray drop can't stack a second modal.
              if (isAnyModalOpen()) return;
              if (payload.paths.length === 0) return;
              await routeToUploadModal(payload.paths, fetchFileFromPath);
            } else {
              setIsDragging(false);
              dndCoordinator.endDrag();
              candidateKind = null;
            }
          });

          unlisteners.push(unlisten);
        } catch (err) {
          console.error("[DragDrop] setup failed:", err);
        }
      };

      // Detect the catch-all modal kind, fetch matching files, open the modal.
      const routeToUploadModal = async (
        paths: string[],
        fetchFileFromPath: (path: string, fileName: string) => Promise<File>,
      ) => {
        let modalKind: ModalType = null;
        for (const p of paths) {
          modalKind = getModalTypeForFileName(p.split(/[/\\]/).pop() ?? "");
          if (modalKind) break;
        }
        if (!modalKind) return;

        const matchingPaths = paths.filter(
          (p) => getModalTypeForFileName(p.split(/[/\\]/).pop() ?? "") === modalKind,
        );
        const skippedCount = paths.length - matchingPaths.length;
        if (skippedCount > 0) {
          toast(
            `${skippedCount} file${skippedCount > 1 ? "s" : ""} skipped — unsupported or mixed types`,
            { icon: "⚠️" },
          );
        }

        try {
          const files = await Promise.all(
            matchingPaths.map((path) =>
              fetchFileFromPath(path, path.split(/[/\\]/).pop() ?? "file"),
            ),
          );
          setModalType(modalKind);
          setPendingFiles(files);
        } catch (err) {
          console.error("[DragDrop] file read failed:", err);
        }
      };

      setup();
      return () => { unlisteners.forEach((fn) => fn()); };

    } else {
      // HTML5 path (browser dev mode + webapp shares this via its own handler).
      const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        if (!e.dataTransfer?.types.includes("Files")) return;
        dragCounter.current++;
      };
      const handleDragLeave = (e: DragEvent) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        dragCounter.current--;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setIsDragging(false);
          dndCoordinator.endDrag();
        }
      };
      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        if (!e.dataTransfer?.types.includes("Files")) return;

        // The File bytes aren't readable during hover, but the MIME type is.
        let kind = null;
        const items = e.dataTransfer.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === "file") {
            kind = mediaKindFromMime(items[i].type);
            if (kind) break;
          }
        }

        if (kind) {
          dndCoordinator.beginDrag({
            source: "os-file",
            kind,
            fileName: "",
            getFile: async () => {
              throw new Error("file unavailable during hover");
            },
          });
          const { target } = dndCoordinator.updateHover(e.clientX, e.clientY);
          setIsDragging(!target && !isAnyModalOpen());
        } else {
          dndCoordinator.updateHover(-1, -1);
          setIsDragging(!isAnyModalOpen());
        }
      };
      const handleDrop = async (e: DragEvent) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        e.preventDefault();
        setIsDragging(false);
        dragCounter.current = 0;

        const allFiles = Array.from(e.dataTransfer.files);
        const first = allFiles[0];

        // Try the registry first with the real File (now available).
        if (first) {
          const kind = mediaKindFromFile(first);
          if (kind) {
            const handled = await dndCoordinator.drop(e.clientX, e.clientY, {
              source: "os-file",
              kind,
              fileName: first.name,
              getFile: async () => first,
            });
            dndCoordinator.endDrag();
            if (handled) return;
          } else {
            dndCoordinator.endDrag();
          }
        }

        // Catch-all fallback (suppressed while a modal is open).
        if (isAnyModalOpen()) return;
        if (allFiles.length === 0) return;

        let modalKind: ModalType = null;
        for (const f of allFiles) {
          modalKind = getModalTypeForFileName(f.name);
          if (modalKind) break;
        }
        if (!modalKind) return;

        const matchingFiles = allFiles.filter(
          (f) => getModalTypeForFileName(f.name) === modalKind,
        );
        const skippedCount = allFiles.length - matchingFiles.length;
        if (skippedCount > 0) {
          toast(
            `${skippedCount} file${skippedCount > 1 ? "s" : ""} skipped — unsupported or mixed types`,
            { icon: "⚠️" },
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

  return (
    <>
      {isDragging && modalType === null && (
        <div
          className="pointer-events-none fixed inset-0 flex items-center justify-center bg-black/40"
          style={{ zIndex: DND_Z.overlay }}
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/60 bg-black/30 px-16 py-12 text-white backdrop-blur-sm">
            <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} className="text-4xl opacity-80" />
            <div className="text-xl font-semibold">Drop to Upload</div>
            <div className="text-sm opacity-60">GLB, PNG, JPG, JPEG, SPZ</div>
          </div>
        </div>
      )}
      <UploadModal3D
        isOpen={modalType === "3d"}
        initialFiles={pendingFiles.length > 0 ? pendingFiles : undefined}
        onClose={closeModal}
        onSuccess={(_category: FilterEngineCategories) => closeModal()}
        title="Upload a 3D Model"
        titleIcon={faCube}
      />
      <UploadModalImage
        isOpen={modalType === "image"}
        initialFiles={pendingFiles.length > 0 ? pendingFiles : undefined}
        onClose={closeModal}
        onSuccess={() => closeModal()}
        title="Upload an Image"
        titleIcon={faImages}
      />
      <UploadModalSplat
        isOpen={modalType === "splat"}
        initialFiles={pendingFiles.length > 0 ? pendingFiles : undefined}
        onClose={closeModal}
        onSuccess={() => {}}
        title="Upload a Splat"
        titleIcon={faCube}
      />
    </>
  );
}
