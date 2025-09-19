import { Select, SelectValue } from "@storyteller/ui-select";
import { useState } from "react";

export const VideoSettingsPane = () => {
  const [defaultVideoModel, setDefaultVideoModel] = useState("veo");
  const [humanVideoProvider, setHumanVideoProvider] = useState("artcraft");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="default-video-model" className="mb-2 block">
          Default Video Model
        </label>
        <Select
          id="default-video-model"
          value={defaultVideoModel}
          onChange={(val: SelectValue) => setDefaultVideoModel(val as string)}
          options={[
            { value: "veo", label: "Veo" },
            { value: "kling", label: "Kling" },
          ]}
        />
      </div>
      <div>
        <label htmlFor="human-video-provider" className="mb-2 block">
          Human Video Provider
        </label>
        <Select
          id="human-video-provider"
          value={humanVideoProvider}
          onChange={(val: SelectValue) => setHumanVideoProvider(val as string)}
          options={[
            { value: "artcraft", label: "ArtCraft" },
            { value: "pal", label: "Pal" },
          ]}
        />
      </div>
    </div>
  );
};
