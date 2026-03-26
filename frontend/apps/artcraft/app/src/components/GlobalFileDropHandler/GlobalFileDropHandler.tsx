import { useEffect, useRef, useState } from "react";
import { faCube, faImages, faUpRightAndDownLeftFromCenter } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UploadModal3D } from "../reusable/UploadModal3D/UploadModal3D";
import { UploadModalImage } from "../reusable/UploadModalImage/UploadModalImage";
import { UploadModalSplat } from "../reusable/UploadModalSplat/UploadModalSplat";
import { FilterEngineCategories } from "../../enums";

type ModalType = "3d" | "image" | "splat" | null;

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

export function GlobalFileDropHandler() {
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const closeModal = () => {
    setModalType(null);
    setPendingFile(null);
  };

  useEffect(() => {
    if (isTauri) {
      const unlisteners: Array<() => void> = [];

      const setup = async () => {
        try {
          const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
          const { convertFileSrc } = await import("@tauri-apps/api/core");
          const appWindow = getCurrentWebviewWindow();

          const unlisten = await appWindow.onDragDropEvent(async (event) => {
            const payload = event.payload;

            if (payload.type === "enter") {
              if (!isAnyModalOpen()) setIsDragging(true);
            } else if (payload.type === "over") {
              // overlay stays visible
            } else if (payload.type === "drop") {
              setIsDragging(false);
              if (isAnyModalOpen()) return;

              const path = payload.paths[0];
              if (!path) return;

              const fileName = path.split(/[/\\]/).pop() ?? "file";
              const type = getModalTypeForFileName(fileName);
              if (type === null) return;

              try {
                const assetUrl = convertFileSrc(path);
                const response = await fetch(assetUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                const file = new File([blob], fileName);
                await appWindow.setFocus();
                setModalType(type);
                setPendingFile(file);
              } catch (err) {
                console.error("[DragDrop] file read failed:", err);
              }
            } else {
              setIsDragging(false);
            }
          });

          unlisteners.push(unlisten);
        } catch (err) {
          console.error("[DragDrop] setup failed:", err);
        }
      };

      setup();
      return () => { unlisteners.forEach((fn) => fn()); };

    } else {
      // HTML5 path (browser dev mode)
      const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        if (!e.dataTransfer?.types.includes("Files")) return;
        if (isAnyModalOpen()) return;
        dragCounter.current++;
        setIsDragging(true);
      };
      const handleDragLeave = (e: DragEvent) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        dragCounter.current--;
        if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
      };
      const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      };
      const handleDrop = (e: DragEvent) => {
        if (!e.dataTransfer?.types.includes("Files")) return;
        e.preventDefault();
        setIsDragging(false);
        dragCounter.current = 0;
        if (isAnyModalOpen()) return;
        const file = e.dataTransfer?.files[0];
        if (!file) return;
        const type = getModalTypeForFileName(file.name);
        if (type === null) return;
        setModalType(type);
        setPendingFile(file);
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
        <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-white/60 bg-black/30 px-16 py-12 text-white backdrop-blur-sm">
            <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} className="text-4xl opacity-80" />
            <div className="text-xl font-semibold">Drop to Upload</div>
            <div className="text-sm opacity-60">GLB, PNG, JPG, JPEG, SPZ</div>
          </div>
        </div>
      )}
      <UploadModal3D
        isOpen={modalType === "3d"}
        initialFile={pendingFile ?? undefined}
        onClose={closeModal}
        onSuccess={(_category: FilterEngineCategories) => closeModal()}
        title="Upload a 3D Model"
        titleIcon={faCube}
      />
      <UploadModalImage
        isOpen={modalType === "image"}
        initialFile={pendingFile ?? undefined}
        onClose={closeModal}
        onSuccess={() => closeModal()}
        title="Upload an Image"
        titleIcon={faImages}
      />
      <UploadModalSplat
        isOpen={modalType === "splat"}
        initialFile={pendingFile ?? undefined}
        onClose={closeModal}
        onSuccess={() => {}}
        title="Upload a Splat"
        titleIcon={faCube}
      />
    </>
  );
}
