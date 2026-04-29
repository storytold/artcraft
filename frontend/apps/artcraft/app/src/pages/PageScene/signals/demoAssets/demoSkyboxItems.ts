import { signal } from "@preact/signals-core";
import { MediaItem } from "../../models";
import { AssetType } from "~/enums";

export const demoSkyboxItems = signal<MediaItem[]>([
  {
    version: 1,
    media_id: "SKY::m_1",
    type: AssetType.SKYBOX,
    name: "Empty Skybox",
    thumbnail: "/resources/placeholders/placeholder.png",
  },
  {
    version: 1,
    media_id: "SKY::Default",
    type: AssetType.SKYBOX,
    name: "Day Skybox",
    thumbnail: "/resources/skybox/day/px.png",
  },
  {
    version: 1,
    media_id: "SKY::m_0",
    type: AssetType.SKYBOX,
    name: "Night Skybox",
    thumbnail: "/resources/skybox/night/Night_Moon_Burst_Cam_2_LeftX.png",
  },
  {
    version: 1,
    media_id: "SKY::m_3",
    type: AssetType.SKYBOX,
    name: "Gray Skybox",
    thumbnail:
      "/resources/skybox/gray/Sky_AllSky_Overcast4_Low_Cam_2_LeftX.png",
  },
  {
    version: 1,
    media_id: "SKY::m_2",
    type: AssetType.SKYBOX,
    name: "Black Skybox",
    thumbnail: "/resources/skybox/black.jpg",
  },
]);
