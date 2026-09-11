import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Longest animation clip in a GLB file, in whole milliseconds — the value the
// backend requires (maybe_duration_millis) for engine_category=animation
// uploads. Returns null when the file has no clips (an animation upload of
// such a file should be rejected client-side rather than 400 on the server).
// Parses headlessly; nothing is added to any scene.
export async function readGlbAnimationDurationMillis(
  file: File,
): Promise<number | null> {
  const buffer = await file.arrayBuffer();
  const gltf = await new Promise<{ animations?: { duration: number }[] }>(
    (resolve, reject) => {
      new GLTFLoader().parse(buffer, "", resolve, reject);
    },
  );
  const durations = (gltf.animations ?? []).map((clip) => clip.duration);
  if (durations.length === 0) return null;
  const maxSeconds = Math.max(...durations);
  if (!(maxSeconds > 0)) return null;
  return Math.round(maxSeconds * 1000);
}
