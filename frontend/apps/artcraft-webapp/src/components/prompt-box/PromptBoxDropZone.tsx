import { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImages, faMusic, faVideo } from "@fortawesome/pro-solid-svg-icons";
import { toast } from "../toast/toast";

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

interface UsePromptBoxDropOptions {
  acceptsImages: boolean;
  acceptsVideos: boolean;
  acceptsAudio: boolean;
  onDropFiles: (files: DroppedFiles) => void;
}

interface PromptBoxDropOverlayProps {
  dragState: DropDragState;
  acceptsImages: boolean;
  acceptsVideos: boolean;
  acceptsAudio: boolean;
  /** Video keyframe mode: images fill the start/end frame slots. */
  keyframeMode?: boolean;
}

const kindOfMime = (mime: string): DropKind | null =>
  mime.startsWith("image/")
    ? "image"
    : mime.startsWith("video/")
      ? "video"
      : mime.startsWith("audio/")
        ? "audio"
        : null;

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
 */
export function usePromptBoxDrop({
  acceptsImages,
  acceptsVideos,
  acceptsAudio,
  onDropFiles,
}: UsePromptBoxDropOptions) {
  const [dragState, setDragState] = useState<DropDragState>("idle");
  const enabled = acceptsImages || acceptsVideos || acceptsAudio;

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

  // While the box is on screen, a stray drop outside it must not navigate
  // the browser to the file (which would blow away the user's session).
  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

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

  const routeFiles = (files: File[]) => {
    const accepted: DroppedFiles = { images: [], videos: [], audios: [] };
    const rejectedKinds = new Set<DropKind>();
    let unknownCount = 0;
    for (const file of files) {
      const kind = kindOfMime(file.type);
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!enabled || !e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState("idle");

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) routeFiles(files);
  };

  // Paste-to-add: a copied image (or media file) pasted anywhere on the
  // page lands in the deck, whether or not the textarea is focused. The
  // listener re-reads the freshest router through a ref so it can stay
  // subscribed once.
  const routeFilesRef = useRef(routeFiles);
  useEffect(() => {
    routeFilesRef.current = routeFiles;
  });
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
      ? [{ icon: faImages, label: keyframeMode ? "Frames" : "Images" }]
      : []),
    ...(acceptsVideos ? [{ icon: faVideo, label: "Video" }] : []),
    ...(acceptsAudio ? [{ icon: faMusic, label: "Audio" }] : []),
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
            <FontAwesomeIcon icon={kind.icon} className="text-sm" />
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
