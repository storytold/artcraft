// GLTFLoader reads .glb/.gltf bytes into three.js objects. It is used here only to read the animation
// clips' lengths; nothing it builds is shown anywhere.
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Longest animation clip in a GLB file, in whole milliseconds — the value the
// backend requires (maybe_duration_millis) for engine_category=animation
// uploads. Returns null when the file has no clips (an animation upload of
// such a file should be rejected client-side rather than 400 on the server).
// Parses headlessly; nothing is added to any scene.
//
// Who calls this: the 3D upload picker (`UploadFiles3D.tsx`) through `resolveAnimationDurations`, once per
// file, before an upload in animation mode starts. Parsing a big GLB takes real time, which is why the
// picker takes its re-entry guard BEFORE awaiting this function (see B-166 in BUGS.md).
export async function readGlbAnimationDurationMillis(
  file: File,
): Promise<number | null> {
  // Read the whole file from disk into memory as raw bytes.
  const buffer = await file.arrayBuffer();
  // GLTFLoader.parse reports through callbacks, so wrap it in a Promise to await it. The generic type
  // names the one field used below (each clip's `duration`, in seconds). The empty string is the base
  // path for external files; an uploaded .glb has none. A corrupt file rejects here, and the caller decides
  // what that means for its row.
  const gltf = await new Promise<{ animations?: { duration: number }[] }>(
    (resolve, reject) => {
      new GLTFLoader().parse(buffer, "", resolve, reject);
    },
  );
  // Collect every clip's length in seconds (a file with no animations has no `animations` array).
  const durations = (gltf.animations ?? []).map((clip) => clip.duration);
  // No clips at all: tell the caller "nothing to time" with null.
  if (durations.length === 0) return null;
  // The upload is described by its longest clip.
  const maxSeconds = Math.max(...durations);
  // Written as `!(x > 0)` on purpose: it is also true for NaN, so a zero, negative or NaN length is treated
  // the same as "no usable clip".
  if (!(maxSeconds > 0)) return null;
  // The backend wants whole milliseconds, so convert and round.
  return Math.round(maxSeconds * 1000);
}
