import { useEditor } from "../../../editor/use-editor";
import { getElementLocalTime } from "../../../animation";
import { addMediaTime, mediaTime, type MediaTime } from "../../../wasm";

export function useElementPlayhead({
  startTime,
  duration,
}: {
  startTime: MediaTime;
  duration: MediaTime;
}) {
  const playheadTime = useEditor((editor) => editor.playback.getCurrentTime());
  const localTime = mediaTime({
    ticks: getElementLocalTime({
      timelineTime: playheadTime,
      elementStartTime: startTime,
      elementDuration: duration,
    }),
  });
  const isPlayheadWithinElementRange =
    playheadTime >= startTime &&
    playheadTime <= addMediaTime({ a: startTime, b: duration });

  return { localTime, isPlayheadWithinElementRange };
}
