import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightLong } from "@fortawesome/pro-solid-svg-icons";
import { useSignals } from "@preact/signals-react/runtime";
import { pageWidth, pageHeight } from "~/signals";

export const PreviewImages = () => {
  useSignals();

  const maxHeight = pageHeight.value - 68 - 120 - 100 - 240;
  const imageWidth1 = (pageWidth.value - 160) / 2;
  const imageHeight1 = Math.min(imageWidth1 * 0.56, maxHeight);

  const imageWidth = imageHeight1 / 0.56;
  const imageHeight = imageHeight1;

  return (
    <div className="flex justify-center gap-1">
      <div
        className="block w-full overflow-hidden rounded-lg border border-ui-controls/25 bg-ui-panel"
        style={{ height: imageHeight, width: imageWidth }}
      >
        <canvas id="raw-preview" width={imageWidth} height={imageHeight} />
      </div>
      <div className="flex w-[60px] flex-col justify-center">
        <FontAwesomeIcon
          icon={faArrowRightLong}
          className="text-3xl opacity-60"
        />
      </div>
      <div
        className="block w-full overflow-hidden rounded-lg border border-ui-controls/25 bg-ui-panel"
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
