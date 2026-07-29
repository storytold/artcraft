import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownToLine,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import {
  SelectionActionBar,
  useGallerySelectionStore,
  type GalleryItem,
} from "@storyteller/ui-generation-list";
import { toast } from "../toast/toast";
import { downloadItemsAsZip } from "../../lib/download-media-zip";
import { useIsMobile } from "../ui/use-mobile";

// Floating bar shown while the generation feed is in select mode:
// "Download selected" zips the chosen items client-side. Centered within the
// content area next to the sidebar; on desktop it sits above the floating
// promptbox via the measured `bottomOffset`, on mobile (History tab — no
// promptbox) it uses a fixed offset like the library's bulk bar.
export function GallerySelectionDownloadBar({
  allItems,
  bottomOffset,
}: {
  allItems: GalleryItem[];
  bottomOffset?: number;
}) {
  const isMobile = useIsMobile();
  const ids = useGallerySelectionStore((s) => s.ids);
  const setActive = useGallerySelectionStore((s) => s.setActive);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const isDownloading = progress !== null;

  const selectedItems = useMemo(() => {
    const byId = new Map(allItems.map((it) => [it.id, it] as const));
    return Array.from(ids)
      .map((id) => byId.get(id))
      .filter(
        (it): it is GalleryItem & { fullImage: string } => !!it?.fullImage,
      );
  }, [allItems, ids]);

  const handleDownload = async () => {
    if (isDownloading || selectedItems.length === 0) return;
    setProgress({ done: 0, total: selectedItems.length });
    try {
      const { succeeded, failed } = await downloadItemsAsZip(
        selectedItems.map((it) => ({
          id: it.id,
          url: it.fullImage,
          mediaClass: it.mediaClass,
        })),
        { onProgress: (done, total) => setProgress({ done, total }) },
      );
      if (failed === 0) {
        toast.success(
          `Downloaded ${succeeded} ${succeeded === 1 ? "file" : "files"}`,
        );
      } else if (succeeded > 0) {
        toast.error(
          `${failed} of ${succeeded + failed} files failed to download`,
        );
      } else {
        toast.error("Could not download the selected files.");
      }
      if (succeeded > 0) setActive(false);
    } finally {
      setProgress(null);
    }
  };

  return (
    <SelectionActionBar
      className={isMobile ? "bottom-20" : ""}
      // Center within the content area (viewport minus the app sidebar); on
      // desktop, sit above the fixed promptbox whatever its measured height.
      style={{
        left: "var(--ac-sidebar-offset, 0px)",
        ...(isMobile ? {} : { bottom: bottomOffset ?? 16 }),
      }}
    >
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading || selectedItems.length === 0}
        className="flex items-center gap-2 rounded-full bg-ui-controls/60 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ui-controls/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
      >
        <FontAwesomeIcon
          icon={isDownloading ? faSpinnerThird : faArrowDownToLine}
          className={`text-xs ${isDownloading ? "animate-spin" : ""}`}
        />
        {isDownloading && progress
          ? `Downloading ${progress.done}/${progress.total}…`
          : "Download"}
      </button>
    </SelectionActionBar>
  );
}
