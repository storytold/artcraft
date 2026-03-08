import { useRef, useEffect, useMemo } from "react";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import { useRafLoop } from "../../hooks/useRafLoop";
import { CanvasRenderer } from "../../services/renderer/CanvasRenderer";

export function PreviewCanvas() {
  const editor = useVideoEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useMemo(() => new CanvasRenderer(), []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) renderer.attach(canvasRef.current);
    return () => renderer.detach();
  }, [renderer]);

  const lastTimeRef = useRef(-1);

  useRafLoop(() => {
    const currentTime = editor.playback.getCurrentTime();
    const isPlaying = editor.playback.getIsPlaying();

    // Only re-render if time changed or if there are tracks
    if (!isPlaying && currentTime === lastTimeRef.current) return;
    lastTimeRef.current = currentTime;

    const settings = editor.project.getSettings();
    if (!settings) return;

    renderer.render({
      tracks: editor.timeline.getTracks(),
      currentTime,
      canvasWidth: settings.canvasSize.width,
      canvasHeight: settings.canvasSize.height,
      assets: editor.media.getAssets(),
      backgroundColor: settings.background.color,
    });
  });

  const settings = editor.project.getSettings();
  const aspectRatio = settings
    ? settings.canvasSize.width / settings.canvasSize.height
    : 16 / 9;

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ flex: 1 }}
    >
      <canvas
        ref={canvasRef}
        className="max-h-full max-w-full rounded"
        style={{
          aspectRatio: `${aspectRatio}`,
          objectFit: "contain",
          background: "#000",
        }}
      />
    </div>
  );
}
