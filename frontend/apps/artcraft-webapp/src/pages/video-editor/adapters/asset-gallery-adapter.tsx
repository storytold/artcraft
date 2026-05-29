import { useMemo, useRef, useState, type ReactElement } from "react";
import type {
  AssetGalleryAdapter,
  MediaKind,
  MediaPickerSelection,
} from "@storyteller/ui-video-editor";
import { GalleryModal, type GalleryItem } from "@storyteller/ui-gallery-modal";

// Webapp AssetGalleryAdapter — wraps @storyteller/ui-gallery-modal in a
// promise-shaped openPicker. The modal lives alongside <VideoEditor> in
// the host page, controlled via React state. openPicker stores a
// resolver in a ref and opens the modal; the onUseSelected callback
// fires the resolver with the picked items, and onClose fires it with
// an empty array.

type Resolver = (selections: MediaPickerSelection[]) => void;

interface GalleryControlState {
  open: boolean;
  filter: string | undefined;
}

interface AssetGalleryHostBundle {
  adapter: AssetGalleryAdapter;
  // Render this alongside <VideoEditor>. The host doesn't need to wire
  // any props — state is owned by the hook.
  modal: ReactElement;
}

function kindsToFilter(kinds: MediaKind[]): string | undefined {
  if (kinds.length === 1) return kinds[0];
  return undefined;
}

function mediaClassToKind(mediaClass: string | undefined): MediaKind {
  if (mediaClass === "video") return "video";
  if (mediaClass === "audio") return "audio";
  return "image";
}

// React hook that returns both the adapter and the JSX to render. The
// page composes its own JSX tree, so this is preferable to mounting
// a portal — co-located with the editor, no surprises.
export function useWebappAssetGalleryAdapter(): AssetGalleryHostBundle {
  const [state, setState] = useState<GalleryControlState>({
    open: false,
    filter: undefined,
  });
  const resolverRef = useRef<Resolver | null>(null);

  const adapter = useMemo<AssetGalleryAdapter>(
    () => ({
      openPicker({ kinds }) {
        return new Promise<MediaPickerSelection[]>((resolve) => {
          resolverRef.current = resolve;
          setState({ open: true, filter: kindsToFilter(kinds) });
        });
      },
    }),
    [],
  );

  const handleUseSelected = (items: GalleryItem[]) => {
    const selections: MediaPickerSelection[] = items.map((item) => ({
      handle: { id: item.id, kind: mediaClassToKind(item.mediaClass) },
      name: item.label,
    }));
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState({ open: false, filter: undefined });
    resolver?.(selections);
  };

  const handleClose = () => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState({ open: false, filter: undefined });
    resolver?.([]);
  };

  const modal = (
    <GalleryModal
      mode="select"
      isOpen={state.open}
      forceFilter={state.filter}
      onUseSelected={handleUseSelected}
      onClose={handleClose}
    />
  );

  return { adapter, modal };
}
