import React, { useEffect, useState } from "react";
import { SceneCard, SceneTypes } from "./SceneCard";

export type { SceneTypes };

interface ScenePickerProps {
  scenes: SceneTypes[];
  onSceneSelect: (selectedScene: SceneTypes) => void;
  showDate?: boolean;
}

export const ScenePicker: React.FC<ScenePickerProps> = ({
  scenes,
  onSceneSelect,
  showDate,
}) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (scenes.length > 0 && !selectedSceneId) {
      setSelectedSceneId(scenes[0].token);
      onSceneSelect(scenes[0]);
    }
  }, [scenes, onSceneSelect, selectedSceneId]);

  const handleSelected = (scene: SceneTypes) => {
    setSelectedSceneId(scene.token);
    onSceneSelect(scene);
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.token}
          scene={scene}
          onSceneSelect={() => handleSelected(scene)}
          selectedSceneId={selectedSceneId}
          showDate={showDate}
        />
      ))}
    </div>
  );
};
