import { MediaFilesApi, MediaUploadApi } from "@storyteller/api";
import { CanvasRenderer, EditorCore } from "@storyteller/ui-video-editor";

// Best-effort project cover capture: renders the active project's current
// frame and attaches it as the media file's cover image so the projects
// landing gets a real thumbnail. Covers are cosmetic — every failure path
// is a silent no-op so the save flow can never be affected.
//
// Mirrors the lib's own snapshot feature (RendererManager.createSnapshot):
// same CanvasRenderer + render tree from the same thread, so it doesn't
// contend with the live preview any more than the built-in snapshot does.

const COVER_WIDTH = 640;
const COVER_JPEG_QUALITY = 0.85;

export async function captureAndUploadProjectCover({
  token,
}: {
  token: string;
}): Promise<void> {
  try {
    const editor = EditorCore.getInstance();
    const renderTree = editor.renderer.getRenderTree();
    const activeProject = editor.project.getActive();
    if (!renderTree || !activeProject) return;
    // The save queue can outlive a project switch; only capture when the
    // editor is still showing the project this save belongs to.
    if (activeProject.metadata.id !== token) return;
    if (editor.timeline.getTotalDuration() === 0) return;

    const { canvasSize, fps } = activeProject.settings;
    const renderTime = Math.min(
      editor.playback.getCurrentTime(),
      editor.timeline.getLastFrameTime(),
    );

    const renderer = new CanvasRenderer({
      width: canvasSize.width,
      height: canvasSize.height,
      fps,
    });
    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = canvasSize.width;
    fullCanvas.height = canvasSize.height;
    await renderer.renderToCanvas({
      node: renderTree,
      time: renderTime,
      targetCanvas: fullCanvas,
    });

    const coverHeight = Math.max(
      1,
      Math.round((COVER_WIDTH * canvasSize.height) / canvasSize.width),
    );
    const coverCanvas = document.createElement("canvas");
    coverCanvas.width = COVER_WIDTH;
    coverCanvas.height = coverHeight;
    const context = coverCanvas.getContext("2d");
    if (!context) return;
    context.drawImage(fullCanvas, 0, 0, COVER_WIDTH, coverHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      coverCanvas.toBlob(
        (result) => resolve(result),
        "image/jpeg",
        COVER_JPEG_QUALITY,
      );
    });
    if (!blob) return;

    const upload = await new MediaUploadApi().UploadImage({
      blob,
      fileName: "cover.jpg",
      uuid: crypto.randomUUID(),
    });
    if (!upload.success || !upload.data) {
      console.warn("Project cover upload failed:", upload.errorMessage);
      return;
    }

    const attach = await new MediaFilesApi().UpdateCoverImage({
      mediaFileToken: token,
      imageToken: upload.data,
    });
    if (!attach.success) {
      console.warn("Project cover attach failed:", attach.errorMessage);
    }
  } catch (error) {
    console.warn("Project cover capture failed:", error);
  }
}
