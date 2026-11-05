import { useMoodboardStore } from "./MoodboardStore";
import { measureImage } from "../boards/measureMedia";
import type { MoodboardAdapter } from "../adapter";
import type { Vec2 } from "./types";

// Place a local image file on the canvas immediately (blob URL), then upload
// in the background and write the returned media token back onto the node.
// Without the write-back the node stays token-less forever: it can't be sent
// to generation and can't survive persistence (blob URLs die with the page).
export async function addCanvasImageFromFile({
  file,
  position,
  adapter,
}: {
  file: File;
  position: Vec2;
  adapter: MoodboardAdapter;
}): Promise<string> {
  const blobUrl = URL.createObjectURL(file);
  let dims = { w: 320, h: 320 };
  try {
    dims = await measureImage(blobUrl);
  } catch (err) {
    console.error("[Moodboard] paste measure failed", err);
  }
  const nodeId = useMoodboardStore
    .getState()
    .addImage(blobUrl, position, dims.w, dims.h, null);

  if (adapter.uploadImage) {
    adapter.uploadImage(file).then(
      async (token) => {
        if (!token) return;
        const store = useMoodboardStore.getState();
        // The node may have been deleted while the upload was in flight.
        if (!store.nodes[nodeId]) return;
        store.updateNode(nodeId, { mediaId: token });

        // WHY: the saved copy of the canvas keeps a blob-backed picture only as its token (src ""), and without a server sync nothing
        // turns that token back into a picture, so an uploaded image came back blank after a restart. Hosts that can turn the token into
        // a lasting address (adapter.resolveMediaUrl) get the node switched over to it, exactly like the grid does.
        if (!adapter.resolveMediaUrl) return;
        let durableUrl: string | null = null;
        try {
          durableUrl = await adapter.resolveMediaUrl(token);
        } catch (err) {
          // A failed lookup leaves the node as it was (blob + token), exactly like a host without the lookup.
          console.error("[Moodboard] resolving the uploaded image failed", err);
        }
        if (!durableUrl) return;
        // The node may also have been deleted while the lookup was running; re-read the store so a stale handle is never used.
        const latest = useMoodboardStore.getState();
        if (!latest.nodes[nodeId]) return;
        latest.updateNode(nodeId, { src: durableUrl });
        // The blob URL is deliberately NOT released here (unlike the grid): the canvas keeps undo/redo snapshots that still point at it,
        // and revoking it would blank the image when the user steps back through history.
      },
      (err) => {
        console.error("[Moodboard] background upload failed", err);
      },
    );
  }
  return nodeId;
}
