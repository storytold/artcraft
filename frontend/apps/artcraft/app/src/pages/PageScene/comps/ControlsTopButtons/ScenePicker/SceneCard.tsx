import React, { useRef, useState } from "react";
import { BucketConfig } from "~/api/BucketConfig";
import { twMerge } from "tailwind-merge";

export type SceneTypes = {
  token: string;
  name: string;
  updated_at?: string;
  thumbnail: string;
};

interface SceneCardProps {
  scene: SceneTypes;
  onSceneSelect: (selectedScene: SceneTypes) => void;
  selectedSceneId: string | null;
  showDate?: boolean;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  onSceneSelect,
  selectedSceneId,
  showDate,
}) => {
  // console.log(scene);
  const [loadError, setLoadError] = useState(false);

  const handleSelected = (scene: SceneTypes) => {
    onSceneSelect(scene);
  };

  const bucketConfig = useRef(new BucketConfig());
  const imageThumbnailUrl =
    scene.thumbnail && bucketConfig.current.getCdnUrl(scene.thumbnail, 360, 20);
  // thumbnail will be replaced with 3d scene screenshots
  const tempThumbnail = "/resources/placeholders/scene_placeholder.png";

  return (
    <button
      key={scene.token}
      className={twMerge(
        "relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border transition-colors ease-in-out",
        selectedSceneId === scene.token
          ? "border-brand-primary"
          : "border-ui-controls-button/25 hover:border-ui-controls-button",
      )}
      onClick={() => handleSelected(scene)}
    >
      <img
        src={
          imageThumbnailUrl && !loadError ? imageThumbnailUrl : tempThumbnail
        }
        className="aspect-video object-cover"
        crossOrigin="anonymous"
        alt={scene.name}
        onError={() => setLoadError(true)}
        loading="lazy"
      />
      <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-t from-black/80 to-transparent" />
      <div className="absolute bottom-[8px] left-[10px] text-start text-sm drop-shadow-md">
        <div className="flex  flex-col">
          <span className="w-60 truncate text-sm font-medium">
            {scene.name}
          </span>
          {showDate && (
            <span className="text-xs opacity-70">{scene.updated_at}</span>
          )}
        </div>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className={`absolute right-1.5 top-1.5 h-[22px] w-[22px] transition-opacity duration-200 ease-in-out ${
          selectedSceneId === scene.token ? "opacity-100" : "opacity-0"
        }`}
      >
        <path
          opacity="1"
          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
          fill="#FC6B68"
        />
        <path
          d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
          fill="#FFFFFF"
        />
      </svg>
    </button>
  );
};
