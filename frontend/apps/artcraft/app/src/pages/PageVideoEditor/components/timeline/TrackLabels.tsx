import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilm,
  faVolumeHigh,
  faFont,
  faEye,
  faEyeSlash,
  faVolumeMute,
} from "@fortawesome/pro-solid-svg-icons";
import { TRACK_CONFIG } from "../../constants/timeline";
import type { TimelineTrack } from "../../types";

interface Props {
  tracks: TimelineTrack[];
}

const TYPE_ICONS = {
  video: faFilm,
  audio: faVolumeHigh,
  text: faFont,
};

export const TrackLabels = memo(function TrackLabels({ tracks }: Props) {
  return (
    <div className="w-[120px] shrink-0 border-r border-ui-panel-border bg-ui-panel">
      {/* Ruler spacer */}
      <div className="h-6 border-b border-ui-panel-border/50" />
      {tracks.map((track) => {
        const config = TRACK_CONFIG[track.type];
        const icon = TYPE_ICONS[track.type];
        const isMuted = "muted" in track && track.muted;
        const isHidden = "hidden" in track && track.hidden;

        return (
          <div
            key={track.id}
            className="flex items-center gap-1.5 border-b border-ui-panel-border/50 px-2 text-xs text-base-fg/70"
            style={{ height: config.height }}
          >
            <FontAwesomeIcon icon={icon} className="text-[10px] opacity-60" />
            <span className="flex-1 truncate">{track.name}</span>
            {isMuted && (
              <FontAwesomeIcon
                icon={faVolumeMute}
                className="text-[9px] text-red-400/60"
              />
            )}
            {isHidden && (
              <FontAwesomeIcon
                icon={faEyeSlash}
                className="text-[9px] text-base-fg/30"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
