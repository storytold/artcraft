import type { VFXResolution } from "./types";

export type VFXShowcaseEntry = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  resolution: VFXResolution;
  source: { url: string; mediaToken: string };
  mask?: { url: string; mediaToken: string };
  reference?: { url: string; mediaToken: string };
  outputUrl: string;
  thumbnailUrl: string;
};

export const VFX_SHOWCASE: VFXShowcaseEntry[] = [
  {
    id: "showcase-change-location",
    title: "Change Location",
    description: "Transport your subject to any location imaginable.",
    prompt:
      "A man with curly hair wearing a grey leather jacket sitting in a luxurious private jet cabin, warm afternoon light streaming through the window.",
    resolution: "720p",
    source: {
      url: "/resources/vfx/showcase/change-location-source.mp4",
      mediaToken: "showcase_src_change_location",
    },
    mask: {
      url: "/resources/vfx/showcase/change-location-mask.png",
      mediaToken: "showcase_mask_change_location",
    },
    reference: {
      url: "/resources/vfx/showcase/change-location-reference.jpg",
      mediaToken: "showcase_ref_change_location",
    },
    outputUrl: "/resources/vfx/showcase/change-location-output.mp4",
    thumbnailUrl: "/resources/vfx/showcase/change-location-thumb.jpg",
  },
  {
    id: "showcase-relight",
    title: "Relight",
    description: "Match your subject's lighting to any reference.",
    prompt:
      "Cinematic golden-hour rim light, soft warm fill, shallow depth of field.",
    resolution: "720p",
    source: {
      url: "/resources/vfx/showcase/relight-source.mp4",
      mediaToken: "showcase_src_relight",
    },
    reference: {
      url: "/resources/vfx/showcase/relight-reference.jpg",
      mediaToken: "showcase_ref_relight",
    },
    outputUrl: "/resources/vfx/showcase/relight-output.mp4",
    thumbnailUrl: "/resources/vfx/showcase/relight-thumb.jpg",
  },
  {
    id: "showcase-time-shift",
    title: "Time Shift",
    description: "Move the same shot from day to night, or season to season.",
    prompt:
      "Same composition, shifted to twilight blue hour with city lights coming on in the background.",
    resolution: "720p",
    source: {
      url: "/resources/vfx/showcase/time-shift-source.mp4",
      mediaToken: "showcase_src_time_shift",
    },
    reference: {
      url: "/resources/vfx/showcase/time-shift-reference.jpg",
      mediaToken: "showcase_ref_time_shift",
    },
    outputUrl: "/resources/vfx/showcase/time-shift-output.mp4",
    thumbnailUrl: "/resources/vfx/showcase/time-shift-thumb.jpg",
  },
  {
    id: "showcase-object-swap",
    title: "Object Swap",
    description: "Swap props and wardrobe while preserving motion.",
    prompt:
      "Replace the coffee cup with a glass of red wine, keep the hand pose and motion identical.",
    resolution: "720p",
    source: {
      url: "/resources/vfx/showcase/object-swap-source.mp4",
      mediaToken: "showcase_src_object_swap",
    },
    reference: {
      url: "/resources/vfx/showcase/object-swap-reference.jpg",
      mediaToken: "showcase_ref_object_swap",
    },
    outputUrl: "/resources/vfx/showcase/object-swap-output.mp4",
    thumbnailUrl: "/resources/vfx/showcase/object-swap-thumb.jpg",
  },
];
