import { useContext } from "react";
import { EngineContext } from "~/pages/PageScene/contexts/EngineContext";
import { ArtStyle } from "~/pages/PageScene/Editor/api_manager";
import { styleList } from "~/pages/PageScene/styleList";
import { ItemPicker } from "./ItemPicker";
import { usePageSceneStore } from "~/pages/PageScene/PageSceneStore";
import { Modal } from "@storyteller/ui-modal";

interface Props {
  onClose: () => void;
}
export const StyleSelection = ({ onClose }: Props) => {
  const editorEngine = useContext(EngineContext);
  const selectedArtStyle = usePageSceneStore((s) => s.selectedArtStyle);
  const setSelectedArtStyle = usePageSceneStore((s) => s.setSelectedArtStyle);

  const handlePickingStylizer = (picked: ArtStyle) => {
    setSelectedArtStyle(picked);
    if (editorEngine === null) {
      console.log("Editor is null");
      return;
    }
    editorEngine.art_style = picked;
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Select a Style"
      className="max-w-6xl"
    >
      <div className="flex max-h-[700px] flex-col gap-4 overflow-y-auto rounded-t-lg bg-ui-panel">
        <div className="grid grid-cols-4 gap-3">
          {styleList.map((style) => (
            <ItemPicker
              key={style.type}
              label={style.label}
              type={style.type}
              selected={selectedArtStyle === style.type}
              onSelected={handlePickingStylizer}
              src={style.image}
              className="aspect-video"
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};
