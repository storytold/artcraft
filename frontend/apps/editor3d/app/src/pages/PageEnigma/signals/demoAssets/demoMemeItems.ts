import { signal } from "@preact/signals-core";
import { MediaItem } from "~/pages/PageEnigma/models";
import { AssetType } from "~/enums";

export const demoMemeItems = signal<MediaItem[]>([
  {
    version: 1,
    media_id: "m_yb02j1b0dn6ashn14ap2e2vnvy1jhz",
    media_type: "glb",
    type: AssetType.CHARACTER,
    name: "Toothless",
    thumbnail: "/resources/memes/toothless.jpg",
  },
  {
    version: 1,
    media_id: "m_jgrzn7f66dvvw90qqttjn3m0dk8gef",
    media_type: "glb",
    type: AssetType.CHARACTER,
    name: "Doge",
    thumbnail: "/resources/memes/doge.jpg",
  },
  {
    version: 1,
    media_id: "m_h8gk5m59252nbza07p08dyn1fnhnsf",
    media_type: "glb",
    type: AssetType.CHARACTER,
    name: "Grimace",
    thumbnail: "/resources/memes/grimace.jpg",
  },
  {
    version: 1,
    media_id: "m_pzjn9583k1hqcetcfv1a2y04hkaspq",
    media_type: "glb",
    type: AssetType.CHARACTER,
    name: "Roblox",
    thumbnail: "/resources/memes/roblox.jpg",
  },
  {
    version: 1,
    media_id: "m_xh0aj0wmdhvyf0pv5jj1wj3ap7p1rf",
    media_type: "glb",
    type: AssetType.CHARACTER,
    name: "JD Vance",
    thumbnail: "/resources/memes/jd_vance.jpg",
  },
  {
    version: 1,
    media_id: "m_v8mkb44wy4r1ed7g5z8bq8n6bynerg",
    media_type: "glb",
    type: AssetType.CHARACTER,
    name: "Lil JD",
    thumbnail: "/resources/memes/lil_jd.jpg",
  },
]);
