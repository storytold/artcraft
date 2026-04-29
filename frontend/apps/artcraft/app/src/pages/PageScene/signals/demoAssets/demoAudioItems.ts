import { signal } from "@preact/signals-core";
import { AudioMediaItem } from "~/pages/PageScene/models";
import { AssetType } from "~/enums";

export const updateDemoAudioItemLength = (
  mediaId: string,
  duration: number,
) => {
  const newList = demoAudioItems.value.map((item) => {
    if (item.media_id === mediaId) item.length = duration;
    return item;
  });
  demoAudioItems.value = [...newList];
};

export const demoAudioItems = signal<AudioMediaItem[]>([
  {
    version: 1,
    media_id: "m_403phjvjkbbaxxbz8y7r6qjay07mfd",
    type: AssetType.AUDIO,
    name: "Talk (Demo Sounds)",
    thumbnail: "/resources/placeholders/audio_placeholder.png",
    category: "demo",
    publicBucketPath:
      "/media/j/a/r/r/3/jarr3asge6t0x048wdzcehzjd2nh4ep7/fakeyou_jarr3asge6t0x048wdzcehzjd2nh4ep7.wav",
  },
  {
    version: 1,
    media_id: "m_w5nn3kjh1fbkmjrdac5b2qaba0pmyt",
    type: AssetType.AUDIO,
    name: "NCS Song",
    thumbnail: "/resources/placeholders/audio_placeholder.png",
    category: "demo",
    publicBucketPath:
      "/media/s/j/t/0/6/sjt06a8y2qrdqe574nry02bpd3bt01ma/upload_sjt06a8y2qrdqe574nry02bpd3bt01ma.wav",
  },
]);
