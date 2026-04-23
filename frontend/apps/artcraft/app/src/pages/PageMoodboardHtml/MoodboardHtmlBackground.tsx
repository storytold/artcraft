import { memo } from "react";
import { useThemeFgRgb } from "../PageMoodboard/useThemeFgRgb";

interface Props {
  pan: { x: number; y: number };
  zoom: number;
  gridSpacing: number;
}

// Dotted grid background rendered as a pure CSS repeating radial-gradient. The
// pattern scales and pans with the viewport: background-size = spacing*zoom,
// background-position = pan. No JS loop per frame like the Konva sceneFunc.
const MoodboardHtmlBackgroundInner = ({ pan, zoom, gridSpacing }: Props) => {
  const fgRgb = useThemeFgRgb();
  const effectiveSpacing = Math.max(gridSpacing * zoom, 1);
  // Match the Konva version's ~1.2px radius on-screen, regardless of zoom.
  const dotRadius = 1.2;
  const dotColor = `rgba(${fgRgb
    .split(" ")
    .map((v) => v.trim())
    .join(",")},0.10)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `radial-gradient(circle, ${dotColor} ${dotRadius}px, transparent ${
          dotRadius + 0.5
        }px)`,
        backgroundSize: `${effectiveSpacing}px ${effectiveSpacing}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    />
  );
};

export const MoodboardHtmlBackground = memo(MoodboardHtmlBackgroundInner);
