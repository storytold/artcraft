import type { MediaItem } from "../../models/assets";
import { AssetType } from "../../enums";

export const demoObjectItems: MediaItem[] = [
  {
    version: 1,
    media_id: "m_0xfrmekc56satjxn66wt6c9dkw7dxe",
    type: AssetType.OBJECT,
    name: "Pikachu Statue",
    thumbnail: "/resources/placeholders/placeholder.png",
  },
  {
    version: 1,
    media_id: "m_4d2s2q1xy9m1xncppr3gf9ne6bm2m0",
    type: AssetType.OBJECT,
    name: "Moon",
    thumbnail: "/resources/objects/moon.png",
  },
  {
    version: 1,
    media_id: "m_t0s6gbvfp78rvc0sd6129za41crr9d",
    type: AssetType.OBJECT,
    name: "Crown",
    thumbnail: "/resources/objects/crown.png",
  },
  {
    version: 1,
    media_id: "m_zp0zykww0k7ka2zagg3q3pb9t123k4",
    type: AssetType.OBJECT,
    name: "Sakura Tree",
    thumbnail: "/resources/objects/sakura.png",
  },
];

export const demoShapeItems: MediaItem[] = [
  {
    version: 1,
    media_id: "Box",
    type: AssetType.SHAPE,
    name: "Cube",
    thumbnail: "/resources/shapes/cube.png",
  },
  {
    version: 1,
    media_id: "Cylinder",
    type: AssetType.SHAPE,
    name: "Cylinder",
    thumbnail: "/resources/shapes/cylinder.png",
  },
  {
    version: 1,
    media_id: "Donut",
    type: AssetType.SHAPE,
    name: "Donut",
    thumbnail: "/resources/shapes/donut.png",
  },
  {
    version: 1,
    media_id: "Sphere",
    type: AssetType.SHAPE,
    name: "Sphere",
    thumbnail: "/resources/shapes/sphere.png",
  },
  {
    version: 1,
    media_id: "Water",
    type: AssetType.SHAPE,
    name: "Water",
    thumbnail: "/resources/shapes/water.png",
  },
  {
    version: 1,
    media_id: "PointLight",
    type: AssetType.SHAPE,
    name: "Point Light",
    thumbnail: "/resources/shapes/pointlight.png",
  },
];
