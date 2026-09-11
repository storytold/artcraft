import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { ImagesIcon, MusicIcon, VideoIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { toast } from "@storyteller/ui-toaster";
import { IsDesktopApp } from "@storyteller/tauri-utils";

// ── Types ───────────────────────────────────────────────────────────────

type DropKind = "image" | "video" | "audio";

/** "accept" / "reject" reflect whether the hovered payload contains at
 *  least one file the current model can take as a reference. */
export type DropDragState = "idle" | "accept" | "reject";

export interface DroppedFiles {
  images: File[];
  videos: File[];
  audios: File[];
}

export interface UsePromptBoxDropOptions {
  acceptsImages: boolean;
  acceptsVideos: boolean;
  acceptsAudio: boolean;
  onDropFiles: (files: DroppedFiles) => void;
}

/** Spreadable props that make an element a prompt-box drop target. */
export interface PromptBoxDropZoneProps {
  ref: React.RefObject<HTMLDivElement | null>;
  onDragEnter: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  onDragLeave: React.DragEventHandler<HTMLDivElement>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
}

interface PromptBoxDropOverlayProps {
  dragState: DropDragState;
  acceptsImages: boolean;
  acceptsVideos: boolean;
  acceptsAudio: boolean;
  /** Video keyframe mode: images fill the start/end frame slots. */
  keyframeMode?: boolean;
}

/**
 * Live count of mounted prompt boxes that own file drops. The desktop's
 * global drop handler reads this to stand down: on a create page the prompt
 * box is the only drop target, so a drop anywhere else does nothing.
 */
let activeDropZoneCount = 0;
const dropZoneCountListeners = new Set<(count: number) => void>();

const adjustActiveDropZoneCount = (delta: number) => {
  activeDropZoneCount = Math.max(0, activeDropZoneCount + delta);
  dropZoneCountListeners.forEach((listener) => listener(activeDropZoneCount));
};

export const isPromptBoxDropZoneActive = () => activeDropZoneCount > 0;

export const subscribeToPromptBoxDropZones = (
  listener: (count: number) => void,
) => {
  dropZoneCountListeners.add(listener);
  return () => {
    dropZoneCountListeners.delete(listener);
  };
};

// Tauri hands us OS paths, not File objects. Extensions are all we get to
// route by, so they mirror the MIME buckets the browser path uses.
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "mkv", "avi", "m4v"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"];

const MIME_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  avif: "image/avif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  m4v: "video/x-m4v",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
  opus: "audio/opus",
};

const kindOfMime = (mime: string): DropKind | null =>
  mime.startsWith("image/")
    ? "image"
    : mime.startsWith("video/")
      ? "video"
      : mime.startsWith("audio/")
        ? "audio"
        : null;

const extensionOf = (path: string) =>
  path.split(/[/\\]/).pop()?.split(".").pop()?.toLowerCase() ?? "";

const kindOfPath = (path: string): DropKind | null => {
  const ext = extensionOf(path);
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
  return null;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const listKinds = (labels: string[]) =>
  labels.length <= 1
    ? (labels[0] ?? "")
    : `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;

/**
 * Makes the prompt box a drop target for reference media, and catches
 * clipboard pastes of files anywhere on the page (focus-independent). Files
 * are routed by MIME type; kinds the current model doesn't take are
 * rejected with a toast instead of silently vanishing.
 *
 * Two transports, one behaviour. In the browser this is plain HTML5 drag
 * events on the returned `dropZoneProps`. Under Tauri the webview never sees
 * those events (the OS drag is captured natively), so the same states are
 * driven from `onDragDropEvent` and the cursor position is hit-tested
 * against the element `dropZoneProps.ref` is attached to.
 */
export function usePromptBoxDrop({
  acceptsImages,
  acceptsVideos,
  acceptsAudio,
  onDropFiles,
}: UsePromptBoxDropOptions) {
  const [dragState, setDragState] = useState<DropDragState>("idle");
  const zoneRef = useRef<HTMLDivElement>(null);
  // Second zone for the focus-mode modal (PromptFullscreenModal); mounted
  // only while it's open, when it visually covers the inline box.
  const fullscreenZoneRef = useRef<HTMLDivElement>(null);
  const enabled = acceptsImages || acceptsVideos || acceptsAudio;
  const isDesktop = IsDesktopApp();

  const acceptsKind = useCallback(
    (kind: DropKind | null) =>
      kind === "image"
        ? acceptsImages
        : kind === "video"
          ? acceptsVideos
          : kind === "audio"
            ? acceptsAudio
            : false,
    [acceptsImages, acceptsVideos, acceptsAudio],
  );

  // Announce ownership of drops for as long as an enabled box is mounted, so
  // the desktop's global drop handler stays out of the way on this page.
  useEffect(() => {
    if (!enabled) return;
    adjustActiveDropZoneCount(1);
    return () => adjustActiveDropZoneCount(-1);
  }, [enabled]);

  const routeFiles = (files: File[]) => {
    const accepted: DroppedFiles = { images: [], videos: [], audios: [] };
    const rejectedKinds = new Set<DropKind>();
    let unknownCount = 0;
    for (const file of files) {
      const kind = kindOfMime(file.type) ?? kindOfPath(file.name);
      if (kind === null) {
        unknownCount++;
      } else if (!acceptsKind(kind)) {
        rejectedKinds.add(kind);
      } else if (kind === "image") {
        accepted.images.push(file);
      } else if (kind === "video") {
        accepted.videos.push(file);
      } else {
        accepted.audios.push(file);
      }
    }

    const anyAccepted =
      accepted.images.length > 0 ||
      accepted.videos.length > 0 ||
      accepted.audios.length > 0;
    if (anyAccepted) onDropFiles(accepted);

    // Mode-neutral wording: a kind can be off because the model lacks it or
    // because the current input mode (e.g. keyframes) doesn't show it.
    if (rejectedKinds.size > 0) {
      toast.error(
        `${capitalize(listKinds([...rejectedKinds]))} references aren't available here`,
      );
    } else if (unknownCount > 0 && !anyAccepted) {
      toast.error(
        `Only ${listKinds(acceptedKindLabels(acceptsImages, acceptsVideos, acceptsAudio))} files can be added here`,
      );
    }
  };

  // Async listeners (Tauri, paste) re-read the freshest router through a ref
  // so they can stay subscribed once instead of resubscribing per render.
  const routeFilesRef = useRef(routeFiles);
  useEffect(() => {
    routeFilesRef.current = routeFiles;
  });

  const acceptsKindRef = useRef(acceptsKind);
  useEffect(() => {
    acceptsKindRef.current = acceptsKind;
  }, [acceptsKind]);

  // ── Browser transport ────────────────────────────────────────────────

  // While the box is on screen, a stray drop outside it must not navigate
  // the browser to the file (which would blow away the user's session).
  useEffect(() => {
    if (!enabled || isDesktop) return;
    const preventNavigation = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    // Drops that land outside the box still need the overlay dismissed.
    const clearDragState = () => setDragState("idle");
    window.addEventListener("dragover", preventNavigation);
    window.addEventListener("drop", preventNavigation);
    window.addEventListener("drop", clearDragState);
    window.addEventListener("dragend", clearDragState);
    return () => {
      window.removeEventListener("dragover", preventNavigation);
      window.removeEventListener("drop", preventNavigation);
      window.removeEventListener("drop", clearDragState);
      window.removeEventListener("dragend", clearDragState);
    };
  }, [enabled, isDesktop]);

  // MIME types are unreliable mid-drag (browsers may report empty strings),
  // so unknown types count as acceptable until the drop resolves them.
  const inspectDrag = useCallback(
    (dt: DataTransfer): DropDragState => {
      const fileItems = Array.from(dt.items).filter((i) => i.kind === "file");
      if (fileItems.length === 0) return "accept";
      const ok = fileItems.some(
        (i) => i.type === "" || acceptsKind(kindOfMime(i.type)),
      );
      return ok ? "accept" : "reject";
    },
    [acceptsKind],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!enabled || !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragState(inspectDrag(e.dataTransfer));
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragState === "idle") return;
    // Child elements fire enter/leave pairs constantly; only reset when the
    // pointer actually exits the drop target's bounds.
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX >= rect.right ||
      e.clientY < rect.top ||
      e.clientY >= rect.bottom
    ) {
      setDragState("idle");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!enabled || !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState("idle");

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) routeFiles(files);
  };

  // ── Tauri transport ──────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !isDesktop) return;
    let unlisten: (() => void) | undefined;
    let disposed = false;

    // Tauri reports positions in physical pixels; CSS coordinates need the
    // display's scale factor divided back out. While focus mode is open its
    // zone covers the inline box, so it takes over the hit-test.
    const isInsideZone = (position: { x: number; y: number }) => {
      const zone = fullscreenZoneRef.current ?? zoneRef.current;
      if (!zone) return false;
      const scale = window.devicePixelRatio || 1;
      const x = position.x / scale;
      const y = position.y / scale;
      const rect = zone.getBoundingClientRect();
      return (
        x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom
      );
    };

    const setup = async () => {
      try {
        const { getCurrentWebviewWindow } = await import(
          "@tauri-apps/api/webviewWindow"
        );
        const { convertFileSrc } = await import("@tauri-apps/api/core");
        const appWindow = getCurrentWebviewWindow();

        const stop = await appWindow.onDragDropEvent(async (event) => {
          const payload = event.payload;

          if (payload.type === "enter" || payload.type === "over") {
            // Paths aren't provided while hovering, so the overlay can only
            // promise "accept" until the drop resolves the real files.
            setDragState(isInsideZone(payload.position) ? "accept" : "idle");
            return;
          }

          if (payload.type !== "drop") {
            setDragState("idle");
            return;
          }

          setDragState("idle");
          if (!isInsideZone(payload.position)) return;
          if (payload.paths.length === 0) return;

          // Only read the files this box can actually take; unsupported ones
          // still reach routeFiles (as zero-byte stand-ins) so it can raise
          // the same "not available here" toast the browser path does.
          const readable = payload.paths.filter(
            (path) => kindOfPath(path) !== null,
          );
          const unsupported = payload.paths.filter(
            (path) => kindOfPath(path) === null,
          );

          const files = await Promise.all(
            readable.map(async (path) => {
              const fileName = path.split(/[/\\]/).pop() ?? "file";
              const type = MIME_BY_EXTENSION[extensionOf(path)] ?? "";
              try {
                const response = await fetch(convertFileSrc(path));
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();
                return new File([blob], fileName, { type });
              } catch (err) {
                console.error("[PromptBoxDrop] file read failed:", err);
                return null;
              }
            }),
          );

          if (disposed) return;

          const readFiles = files.filter((file): file is File => file !== null);
          const failedCount = readable.length - readFiles.length;
          if (failedCount > 0) {
            toast.error(
              `Couldn't read ${failedCount} file${failedCount > 1 ? "s" : ""}`,
            );
          }

          const placeholders = unsupported.map(
            (path) => new File([], path.split(/[/\\]/).pop() ?? "file"),
          );
          const allFiles = [...readFiles, ...placeholders];
          if (allFiles.length > 0) routeFilesRef.current(allFiles);
        });

        if (disposed) stop();
        else unlisten = stop;
      } catch (err) {
        console.error("[PromptBoxDrop] setup failed:", err);
      }
    };

    void setup();
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [enabled, isDesktop]);

  // ── Paste-to-add ─────────────────────────────────────────────────────

  // A copied image (or media file) pasted anywhere on the page lands in the
  // deck, whether or not the textarea is focused.
  useEffect(() => {
    if (!enabled) return;
    const handlePaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      // Plain text pastes carry no files — leave them entirely alone.
      if (files.length === 0) return;
      // Guard against double-adding if more than one box ever mounts.
      const marked = e as ClipboardEvent & { promptBoxHandled?: boolean };
      if (marked.promptBoxHandled) return;
      marked.promptBoxHandled = true;
      // No preventDefault: any text alongside the file still pastes into
      // whichever field is focused.
      routeFilesRef.current(files);
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [enabled]);

  return {
    dragState,
    dropZoneProps: {
      ref: zoneRef,
      // Under Tauri these never fire, but leaving them attached keeps a
      // single code path and costs nothing.
      onDragEnter: handleDragOver,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    // Same handlers with the focus-mode ref, for PromptFullscreenModal —
    // drops there behave exactly like drops on the inline box.
    fullscreenDropZoneProps: {
      ref: fullscreenZoneRef,
      onDragEnter: handleDragOver,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}

/**
 * Full-bleed dashed overlay shown while files hover the prompt box, listing
 * the reference kinds the current model takes (red when none match).
 */
export function PromptBoxDropOverlay({
  dragState,
  acceptsImages,
  acceptsVideos,
  acceptsAudio,
  keyframeMode,
}: PromptBoxDropOverlayProps) {
  if (dragState === "idle") return null;

  const kinds = [
    ...(acceptsImages
      ? [{ icon: ImagesIcon, label: keyframeMode ? "Frames" : "Images" }]
      : []),
    ...(acceptsVideos ? [{ icon: VideoIcon, label: "Video" }] : []),
    ...(acceptsAudio ? [{ icon: MusicIcon, label: "Audio" }] : []),
  ];
  const rejected = dragState === "reject";

  return (
    <div
      className={twMerge(
        "promptbox-drop-overlay pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-[#161618]/85 backdrop-blur-sm",
        rejected ? "border-red-400/80" : "border-primary",
      )}
    >
      <div className="flex items-center gap-2">
        {kinds.map((kind, i) => (
          <div
            key={kind.label}
            className="promptbox-drop-chip flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-base-fg/90"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <DynamicIcon icon={kind.icon} className="text-sm" />
          </div>
        ))}
      </div>
      <div className="text-sm font-semibold text-base-fg">
        {rejected
          ? "That file type isn't supported"
          : keyframeMode && !acceptsVideos && !acceptsAudio
            ? "Drop to set your frames"
            : "Drop to add references"}
      </div>
      <div className="-mt-1 text-xs text-base-fg/60">
        {rejected
          ? `Accepts ${listKinds(acceptedKindLabels(acceptsImages, acceptsVideos, acceptsAudio))} files`
          : kinds.map((kind) => kind.label).join(" · ")}
      </div>
    </div>
  );
}

function acceptedKindLabels(
  acceptsImages: boolean,
  acceptsVideos: boolean,
  acceptsAudio: boolean,
): string[] {
  return [
    ...(acceptsImages ? ["image"] : []),
    ...(acceptsVideos ? ["video"] : []),
    ...(acceptsAudio ? ["audio"] : []),
  ];
}
