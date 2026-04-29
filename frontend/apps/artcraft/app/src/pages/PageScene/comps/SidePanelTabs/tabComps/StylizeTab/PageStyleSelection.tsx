import { useContext } from "react";
import { EngineContext } from "~/pages/PageScene/contexts/EngineContext";
import { ArtStyle } from "~/pages/PageScene/engine/api_manager";
import { styleList } from "~/pages/PageScene/styleList";
import { ItemPicker } from "./ItemPicker";
import { TabTitle } from "../../sharedComps/TabTitle";
import { StylizeTabPages } from "~/pages/PageScene/enums";

interface Props {
  selection: ArtStyle;
  setSelection: (art: ArtStyle) => void;
  changePage: (newPage: StylizeTabPages) => void;
}
export const PageStyleSelection = ({
  setSelection,
  selection,
  changePage,
}: Props) => {

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
    <>
      <TabTitle
        title="Select a Style"
        onBack={() => changePage(StylizeTabPages.MAIN)}
      />
      <div className="flex flex-col gap-4 overflow-hidden rounded-t-lg bg-ui-panel">
        <div className="overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            {styleList.map((style) => (
              <ItemPicker
                key={style.type}
                label={style.label}
                type={style.type}
                selected={selection === style.type}
                onSelected={handlePickingStylizer}
                src={style.image}
                className="aspect-video"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
