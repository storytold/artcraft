import { useSignals } from "@preact/signals-react/runtime";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useShallow } from "zustand/shallow";
import { EditorStates } from "~/pages/PageScene/enums";
import { pageHeight, pageWidth } from "~/signals";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";

export const PreviewFrameImage = () => {
  useSignals();
  const { editorState, previewSrc } = usePageSceneStore(
    useShallow((s) => ({
      editorState: s.editorState,
      previewSrc: s.previewSrc,
    })),
  );

  if (editorState !== EditorStates.PREVIEW) {
    return null;
  }

  const width = pageWidth.value - 84;
  const height = pageHeight.value - 56;

  if (previewSrc === "") {
    return (
      <div className="absolute inset-0" style={{ width, height }}>
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
          <span className="absolute h-full w-full bg-black opacity-50" />
          <FontAwesomeIcon icon={faSpinnerThird} spin size="4x" />
          <h3 className="z-20 text-white">Generating Preview...</h3>
        </div>
      </div>
    );
  }

  return (
    <img
      alt="preview of the art style that renders over the 3d scene"
      className="absolute inset-0 object-cover"
      src={previewSrc}
      style={{ width, height }}
    />
  );
};
