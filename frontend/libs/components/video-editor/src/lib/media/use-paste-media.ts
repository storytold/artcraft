import { useEffect } from "react";
import { useEditor } from "../editor/use-editor";
import { useEditorAdapters } from "../EditorProvider";
import { processMediaAssets } from "./processing";
import { showMediaUploadToast } from "./upload-toast";
import { buildElementFromMedia } from "../timeline/element-utils";
import { AddMediaAssetCommand } from "../commands/media";
import { InsertElementCommand } from "../commands/timeline";
import { BatchCommand } from "../commands";
import { DEFAULT_NEW_ELEMENT_DURATION } from "../timeline/creation";
import { mediaTimeFromSeconds } from "../wasm";
import { isTypableDOMElement } from "../utils/browser";
import type { MediaType } from "./types";

const MEDIA_MIME_PREFIXES: MediaType[] = ["image", "video", "audio"];

function isMediaMimeType({ type }: { type: string }): boolean {
  return MEDIA_MIME_PREFIXES.some((prefix) => type.startsWith(`${prefix}/`));
}

function extractMediaFilesFromClipboard({
  clipboardData,
}: {
  clipboardData: DataTransfer | null;
}): File[] {
  if (!clipboardData?.items) return [];

  const files: File[] = [];
  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    if (item.kind !== "file") continue;
    if (!isMediaMimeType({ type: item.type })) continue;

    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}

export function usePasteMedia() {
  const editor = useEditor();
  const { toast, mediaSource } = useEditorAdapters();

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;

      if (activeElement && isTypableDOMElement({ element: activeElement })) {
        return;
      }

      const files = extractMediaFilesFromClipboard({
        clipboardData: event.clipboardData,
      });
      if (files.length === 0) {
        event.preventDefault();
        editor.clipboard.paste();
        return;
      }

      event.preventDefault();

      const activeProject = editor.project.getActive();
      if (!activeProject) return;

      try {
        await showMediaUploadToast({
          filesCount: files.length,
          toast,
          promise: async () => {
            const processedAssets = await processMediaAssets({
              files,
              toast,
              mediaSource,
            });
            const startTime = editor.playback.getCurrentTime();

            for (const asset of processedAssets) {
              const addMediaCmd = new AddMediaAssetCommand({
                projectId: activeProject.metadata.id,
                asset,
              });
              const assetId = addMediaCmd.getAssetId();
              const duration =
                asset.duration != null
                  ? mediaTimeFromSeconds({ seconds: asset.duration })
                  : DEFAULT_NEW_ELEMENT_DURATION;
              const trackType = asset.type === "audio" ? "audio" : "video";

              const element = buildElementFromMedia({
                mediaId: assetId,
                mediaType: asset.type,
                name: asset.name,
                duration,
                startTime,
                buffer:
                  asset.type === "audio"
                    ? new AudioBuffer({ length: 1, sampleRate: 44100 })
                    : undefined,
              });

              const insertCmd = new InsertElementCommand({
                element,
                placement: { mode: "auto", trackType },
              });
              const batchCmd = new BatchCommand([addMediaCmd, insertCmd]);
              editor.command.execute({ command: batchCmd });
            }

            return {
              uploadedCount: processedAssets.length,
              assetNames: processedAssets.map((asset) => asset.name),
            };
          },
        });
      } catch (error) {
        console.error("Failed to paste media:", error);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [editor, toast, mediaSource]);
}
