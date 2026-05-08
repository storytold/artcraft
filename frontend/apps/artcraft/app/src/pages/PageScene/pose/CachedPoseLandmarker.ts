import { PoseLandmarker, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { CachedFilesetResolver } from "./CachedFilesetResolver";

export class CachedPoseLandmarker {
  private static instance: CachedPoseLandmarker;
  private poseLandmarker: PoseLandmarker;

  /** Singleton constructor */
  public static async getInstance() : Promise<CachedPoseLandmarker> {
    if (CachedPoseLandmarker.instance !== undefined) {
      return CachedPoseLandmarker.instance;
    }
    const filesetResolver = (await CachedFilesetResolver.getInstance()).filesetResolver;

    // TODO(bt,2025-01-30): We may need to detect multiple poses or for video.
    const numPoses = 1;
    const runningMode = "IMAGE";

    // TODO(bt,2025-01-30): We may want to try other weights as well as the "holistic" weights.
    const poseLandmarker = await PoseLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          // modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: runningMode,
        numPoses: numPoses,
      },
    );

    let instance = new CachedPoseLandmarker(poseLandmarker);
    CachedPoseLandmarker.instance = instance;
    return instance;
  }

  /** Calculate pose for an image */
  public detectForImage(image: HTMLImageElement) : PoseLandmarkerResult {
    return this.poseLandmarker.detect(image);
  }

  private constructor(poseLandmarker: PoseLandmarker) {
    this.poseLandmarker = poseLandmarker;
  }
}
