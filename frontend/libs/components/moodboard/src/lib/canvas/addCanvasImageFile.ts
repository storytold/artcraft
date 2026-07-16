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
      (token) => {
        if (!token) return;
        const store = useMoodboardStore.getState();
        // The node may have been deleted while the upload was in flight.
        if (store.nodes[nodeId]) store.updateNode(nodeId, { mediaId: token });
      },
      (err) => {
        console.error("[Moodboard] background upload failed", err);
      },
    );
  }
  return nodeId;
}
