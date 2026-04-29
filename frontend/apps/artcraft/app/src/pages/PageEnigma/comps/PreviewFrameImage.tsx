import { useSignals } from "@preact/signals-react/runtime";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { pageHeight, pageWidth } from "~/signals";
import { editorState, previewSrc } from "~/pages/PageEnigma/signals/engine";
import {
  sidePanelWidth,
  sidePanelVisible,
} from "~/pages/PageEnigma/signals";

export const PreviewFrameImage = () => {
  useSignals();
  if (editorState.value === EditorStates.PREVIEW) {
    if (previewSrc.value === "") {
      return (
        <div
          className="absolute inset-0"
          style={{
            width:
              pageWidth.value -
              (sidePanelVisible.value ? sidePanelWidth.value : 0) -
              84,
            height: pageHeight.value - 56,
          }}
        >
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
            <span className="absolute h-full w-full bg-black opacity-50" />
            <FontAwesomeIcon icon={faSpinnerThird} spin size="4x" />
            <h3 className="z-20 text-white">Generating Preview...</h3>
          </div>
        </div>
      );
    } else {
      return (
        <img
          alt="preview of the art style that renders over the 3d scene"
          className="absolute inset-0 object-cover"
          src={previewSrc.value}
          style={{
            width:
              pageWidth.value -
              (sidePanelVisible.value ? sidePanelWidth.value : 0) -
              84,
            height: pageHeight.value - 56,
          }}
        />
      );
    }
  }
  return null;
};
