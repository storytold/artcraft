import { faCube, faMagicWandSparkles } from "@fortawesome/pro-solid-svg-icons";
import { Tooltip } from "~/components";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { AssetModal } from "./AssetModal";
import { usePageSceneStore } from "../../PageSceneStore";

export const AssetMenu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    usePageSceneStore.getState().setAssetModalVisibleDuringDrag(true);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="glass absolute left-2 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-lg p-1">
        <Tooltip content="Add 3D object to scene" position="right" delay={100}>
          <Button
            icon={faCube}
            className="h-12 w-12 text-lg"
            onClick={handleOpenModal}
          />
        </Tooltip>
        <Tooltip
          content="Create 3D model from image"
          position="right"
          delay={100}
        >
          <Button
            icon={faMagicWandSparkles}
            className="h-12 w-12 text-lg"
            variant="secondary"
            disabled={true}
            onClick={handleOpenModal}
          />
        </Tooltip>
      </div>

      <AssetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
