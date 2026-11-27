import { captureStill, recordVideo } from "./recordOutput";
import { usePageSceneStore } from "../PageSceneStore";
import type Editor from "../engine/editor";

const { recorderLoaded, recordTimeline } = vi.hoisted(() => ({
  recorderLoaded: vi.fn(),
  recordTimeline: vi.fn(),
}));

vi.mock("../engine/recording/TimelineRecorder", () => {
  recorderLoaded();
  return { recordTimeline };
});

describe("3D Stage recording", () => {
  beforeEach(() => {
    usePageSceneStore.setState({
      timelineExists: false,
      recordingProgress: null,
      encodeCancelSignal: null,
      producedArtifact: null,
    });
    recordTimeline.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads the video recorder only for a recording with a timeline", async () => {
    const editor = createEditor();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    captureStill(editor);
    await recordVideo(editor);

    expect(editor.snapShotOfCurrentFrame).toHaveBeenCalledWith(false);
    expect(recorderLoaded).not.toHaveBeenCalled();

    usePageSceneStore.getState().setTimelineExists(true);
    await recordVideo(editor);

    expect(recorderLoaded).toHaveBeenCalledTimes(1);
    expect(recordTimeline).toHaveBeenCalledOnce();
  });

  it("hands the recorded video to the review modal and clears progress", async () => {
    usePageSceneStore.getState().setTimelineExists(true);
    const editor = createEditor();
    const video = {
      blob: new Blob(["recording"], { type: "video/webm" }),
      mimeType: "video/webm",
      fileName: "scene-recording.webm",
    };
    recordTimeline.mockResolvedValue(video);
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:fixture-video");
    });

    const recording = recordVideo(editor);
    expect(usePageSceneStore.getState().recordingProgress).toEqual({
      phase: "encoding",
      pct: 0,
    });
    await recording;

    expect(editor.cameraController.enterCameraView).toHaveBeenCalledOnce();
    expect(usePageSceneStore.getState()).toMatchObject({
      recordingProgress: null,
      encodeCancelSignal: null,
      producedArtifact: { ...video, kind: "video", objectUrl: "blob:fixture-video" },
    });
  });

  it("does not start encoding when cancelled before the recorder is ready", async () => {
    usePageSceneStore.getState().setTimelineExists(true);

    const recording = recordVideo(createEditor());
    usePageSceneStore.getState().requestEncodeCancel();
    await recording;

    expect(recordTimeline).not.toHaveBeenCalled();
    expect(usePageSceneStore.getState()).toMatchObject({
      recordingProgress: null,
      encodeCancelSignal: null,
    });
  });

  it("does not start encoding after leaving the scene", async () => {
    usePageSceneStore.getState().setTimelineExists(true);
    let live = true;

    const recording = recordVideo(createEditor(() => live));
    live = false;
    await recording;

    expect(recordTimeline).not.toHaveBeenCalled();
    expect(usePageSceneStore.getState().recordingProgress).toBeNull();
  });
});

function createEditor(isLive = () => true): Editor {
  return {
    get isLive() {
      return isLive();
    },
    cameraController: { enterCameraView: vi.fn() },
    snapShotOfCurrentFrame: vi.fn(),
  } as unknown as Editor;
}
