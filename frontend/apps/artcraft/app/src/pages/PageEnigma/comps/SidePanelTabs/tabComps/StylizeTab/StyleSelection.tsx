// OLD STYLE SELECTION, KEEP FOR BACKUP IN CASE WE WANT TO REVERT BACK TO ONE PAGE STYLIZE TAB

import { useContext, useState } from "react";
import { ButtonIcon } from "@storyteller/ui-button-icon";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { ArtStyle } from "~/pages/PageEnigma/Editor/api_manager";
import { faAngleLeft, faAngleRight } from "@fortawesome/pro-solid-svg-icons";
import { styleList } from "~/pages/PageEnigma/styleList";
import { sidePanelWidth } from "~/pages/PageEnigma/signals";
import { pageHeight } from "~/signals";
import { ItemPicker } from "./ItemPicker";
import { useSignals } from "@preact/signals-react/runtime";

interface Props {
  selection: ArtStyle;
  setSelection: (art: ArtStyle) => void;
}
export const StyleSelection = ({ setSelection, selection }: Props) => {
  useSignals();
  const [scrollPosition, setScrollPosition] = useState(0);

  const shownImageCount = Math.floor((sidePanelWidth.value - 32) / 104);
  const imageWidth =
    96 + (sidePanelWidth.value - 32 - shownImageCount * 104) / shownImageCount;
  const imageHeight = (54 * imageWidth) / 90;

  const imageRows = Math.min(
    Math.max(Math.floor((pageHeight.value - 64 - 520) / imageHeight), 2),
    4,
  );

  const maxWidth = Math.ceil(styleList.length / imageRows);

  const editorEngine = useContext(EngineContext);

  const handlePickingStylizer = (picked: ArtStyle) => {
    setSelection(picked);
    if (editorEngine === null) {
      console.log("Editor is null");
      return;
    }
    editorEngine.art_style = picked;
  };

  return (
    <div className="flex flex-col gap-4 rounded-t-lg bg-ui-panel px-4">
      <div className="flex flex-col">
        <div className="relative">
          <div
            className="relative overflow-hidden"
            style={{
              width: sidePanelWidth.value - 32,
              height: imageHeight * imageRows + 8 * imageRows,
            }}
          >
            <div
              className="absolute flex flex-col gap-1 transition-all duration-300 ease-in-out"
              style={{
                width: styleList.length * 54,
                left: scrollPosition * (imageWidth + 8) * -1,
                top: 0,
              }}
            >
              {[...Array(imageRows).keys()].map((_, rowCount) => (
                <div key={rowCount} className="flex gap-1">
                  {styleList
                    .filter((_, index) => index % imageRows === rowCount)
                    .map((style) => (
                      <ItemPicker
                        key={style.type}
                        label={style.label}
                        type={style.type}
                        selected={selection === style.type}
                        onSelected={handlePickingStylizer}
                        src={style.image}
                        width={imageWidth}
                        height={imageHeight}
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
          {scrollPosition > 0 && (
            <div className="pointer-events-none absolute left-[-10px] top-0 h-full w-12">
              <div className="flex h-full w-full items-center justify-start">
                <ButtonIcon
                  icon={faAngleLeft}
                  onClick={() =>
                    setScrollPosition(
                      Math.max(
                        scrollPosition - Math.max(shownImageCount - 1, 1),
                        0,
                      ),
                    )
                  }
                  className="pointer-events-auto h-6 w-6 rounded-full bg-white/80 text-gray-800/75 hover:bg-white/100 hover:text-gray-800"
                />
              </div>
            </div>
          )}
          {scrollPosition < maxWidth - shownImageCount && (
            <div className="pointer-events-none absolute right-[-32px] top-0 h-full w-12">
              <div className="flex h-full w-full items-center justify-end pr-6">
                <ButtonIcon
                  icon={faAngleRight}
                  onClick={() =>
                    setScrollPosition(
                      Math.min(
                        scrollPosition + Math.max(shownImageCount - 1, 1),
                        maxWidth - shownImageCount,
                      ),
                    )
                  }
                  className="pointer-events-auto h-6 w-6 rounded-full bg-white/80 text-gray-800/75 hover:bg-white/100 hover:text-gray-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
