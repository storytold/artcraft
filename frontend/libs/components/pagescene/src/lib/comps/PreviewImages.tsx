import { MoveRightIcon } from "lucide-react";
import { useViewportSize } from "../hooks/useViewportSize";

export const PreviewImages = () => {
  const { width, height } = useViewportSize();
  const maxHeight = height - 68 - 120 - 100 - 240;
  const imageWidth1 = (width - 160) / 2;
  const imageHeight1 = Math.min(imageWidth1 * 0.56, maxHeight);

  const imageWidth = imageHeight1 / 0.56;
  const imageHeight = imageHeight1;

  return (
    <div className="flex justify-center gap-1">
      <div
        className="block w-full overflow-hidden rounded-[3px] border border-ui-controls/25 bg-ui-panel"
        style={{ height: imageHeight, width: imageWidth }}
      >
        <canvas id="raw-preview" width={imageWidth} height={imageHeight} />
      </div>
      <div className="flex w-[60px] flex-col justify-center">
        <MoveRightIcon
          
          className="text-xl opacity-60" />
      </div>
      <div
        className="block w-full overflow-hidden rounded-[3px] border border-ui-controls/25 bg-ui-panel"
        style={{ height: imageHeight, width: imageWidth }}
      >
        <img
          id="styled-preview"
          alt="Styled Preview"
          width={imageWidth}
          height={imageHeight}
        />
      </div>
    </div>
  );
};
