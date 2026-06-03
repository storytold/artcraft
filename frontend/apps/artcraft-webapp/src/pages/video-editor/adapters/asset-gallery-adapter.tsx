import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
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
  // GalleryModal at mode="select" only registers user clicks when an
  // onSelectItem handler is wired; without selectedItemIds tracking
  // the "Use selected" button hands back an empty array.
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const resolverRef = useRef<Resolver | null>(null);

  // Reject (resolve-empty) any pending resolver. Used when a second
  // openPicker call arrives before the first one resolved, or when the
  // hook unmounts mid-flow. Without this the first promise hangs
  // forever and the caller's UI stays stuck in its "processing" state.
  const settlePending = (selections: MediaPickerSelection[]) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    resolver?.(selections);
  };

  // Unmount cleanup — fail any in-flight picker rather than leak it.
  useEffect(() => {
    return () => {
      settlePending([]);
    };
    // settlePending closes over the ref; safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adapter = useMemo<AssetGalleryAdapter>(
    () => ({
      openPicker({ kinds }) {
        return new Promise<MediaPickerSelection[]>((resolve) => {
          // If a previous picker hasn't settled (user clicked Browse
          // again before the modal closed, or two consumers raced for
          // the picker), resolve it empty so its caller can unwind.
          settlePending([]);
          setSelectedItemIds([]);
          resolverRef.current = resolve;
          setState({ open: true, filter: kindsToFilter(kinds) });
        });
      },
    }),
    [],
  );

  const handleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id],
    );
  };

  const handleUseSelected = (items: GalleryItem[]) => {
    const selections: MediaPickerSelection[] = items.map((item) => ({
      handle: { id: item.id, kind: mediaClassToKind(item.mediaClass) },
      name: item.label,
    }));
    setState({ open: false, filter: undefined });
    setSelectedItemIds([]);
    settlePending(selections);
  };

  const handleClose = () => {
    setState({ open: false, filter: undefined });
    setSelectedItemIds([]);
    settlePending([]);
  };

  const modal = (
    <GalleryModal
      mode="select"
      isOpen={state.open}
      forceFilter={state.filter}
      selectedItemIds={selectedItemIds}
      onSelectItem={handleSelectItem}
      onUseSelected={handleUseSelected}
      onClose={handleClose}
    />
  );

  return { adapter, modal };
}
