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

// Tauri AssetGalleryAdapter — wraps @storyteller/ui-gallery-modal in a
// promise-shaped openPicker, matching the webapp's pattern verbatim.
// The gallery modal is session-agnostic — it talks to the same HTTPS
// `/v1/session` endpoint as the webapp, so it works in the Tauri
// WebView with no Tauri-specific wiring.

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

export function useTauriAssetGalleryAdapter(): AssetGalleryHostBundle {
  const [state, setState] = useState<GalleryControlState>({
    open: false,
    filter: undefined,
  });
  // GalleryModal at mode="select" only registers user clicks when an
  // onSelectItem handler is wired; without selectedItemIds tracking
  // the "Use selected" button hands back an empty array.
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const resolverRef = useRef<Resolver | null>(null);

  // Settle any pending resolver (resolve-empty). Used when a second
  // openPicker arrives before the first one resolved, or when the
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
