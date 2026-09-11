import {
  Input,
  ALL_FORMATS,
  BlobSource,
  VideoSampleSink,
  type VideoCodec,
} from "mediabunny";
import { createTimelineAudioBuffer } from "./audio";
import type { SceneTracks } from "../timeline/types";
import type { MediaAsset } from "./types";
import { TICKS_PER_SECOND } from "../wasm";
import { renderThumbnailDataUrl } from "./thumbnail";

export type VideoFileData = {
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  codec: VideoCodec | null;
  canDecode: boolean;
  thumbnailUrl: string | null;
};

export async function readVideoFile({
  file,
}: {
  file: File;
}): Promise<VideoFileData> {
  const input = new Input({
    source: new BlobSource(file),
    formats: ALL_FORMATS,
  });

  try {
    const duration = await input.computeDuration();
    const videoTrack = await input.getPrimaryVideoTrack();

    if (!videoTrack) {
      throw new Error("No video track found in the file");
    }

    const canDecode = await videoTrack.canDecode();
    const packetStats = await videoTrack.computePacketStats(100);
    const audioTrack = await input.getPrimaryAudioTrack();

    let thumbnailUrl: string | null = null;
    if (canDecode) {
      const sink = new VideoSampleSink(videoTrack);
      const frame = await sink.getSample(1);
      if (frame) {
        try {
          thumbnailUrl = renderThumbnailDataUrl({
            width: videoTrack.displayWidth,
            height: videoTrack.displayHeight,
            draw: ({ context, width, height }) => {
              frame.draw(context, 0, 0, width, height);
            },
          });
        } finally {
          frame.close();
        }
      }
    }

    return {
      duration,
      width: videoTrack.displayWidth,
      height: videoTrack.displayHeight,
      fps: packetStats.averagePacketRate,
      hasAudio: audioTrack !== null,
      codec: videoTrack.codec,
      canDecode,
      thumbnailUrl,
    };
  } finally {
    input.dispose();
  }
}

const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 2;
const EMPTY_TIMELINE_SILENT_DURATION_SECONDS = 0.1;
const MIN_SILENT_DURATION_SECONDS = 0.001;

export const extractTimelineAudio = async ({
  tracks,
  mediaAssets,
  totalDuration,
  onProgress,
}: {
  tracks: SceneTracks;
  mediaAssets: MediaAsset[];
  totalDuration: number;
  onProgress?: (progress: number) => void;
}): Promise<Blob> => {
  if (totalDuration === 0) {
    return createWavBlob({
      samples: new Float32Array(
        SAMPLE_RATE * EMPTY_TIMELINE_SILENT_DURATION_SECONDS,
      ),
    });
  }

  onProgress?.(10);

  const audioBuffer = await createTimelineAudioBuffer({
    tracks,
    mediaAssets,
    duration: totalDuration,
    sampleRate: SAMPLE_RATE,
  });

  if (!audioBuffer) {
    const silentDurationSeconds = Math.max(
      MIN_SILENT_DURATION_SECONDS,
      totalDuration / TICKS_PER_SECOND,
    );
    const silentSamples = new Float32Array(
      Math.ceil(silentDurationSeconds * SAMPLE_RATE) * NUM_CHANNELS,
    );
    return createWavBlob({ samples: silentSamples });
  }

  onProgress?.(90);

  const interleavedSamples = interleaveAudioBuffer({ audioBuffer });
  onProgress?.(100);

  return createWavBlob({ samples: interleavedSamples });
};

function interleaveAudioBuffer({
  audioBuffer,
}: {
  audioBuffer: AudioBuffer;
}): Float32Array {
  const numChannels = Math.min(NUM_CHANNELS, audioBuffer.numberOfChannels);
  const interleavedSamples = new Float32Array(
    audioBuffer.length * NUM_CHANNELS,
  );

  for (let sampleIndex = 0; sampleIndex < audioBuffer.length; sampleIndex++) {
    for (let channel = 0; channel < NUM_CHANNELS; channel++) {
      const sourceChannel = Math.min(channel, Math.max(0, numChannels - 1));
      interleavedSamples[sampleIndex * NUM_CHANNELS + channel] =
        audioBuffer.getChannelData(sourceChannel)[sampleIndex] ?? 0;
    }
  }

  return interleavedSamples;
}

function createWavBlob({ samples }: { samples: Float32Array }): Blob {
  const numChannels = NUM_CHANNELS;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = samples.length / numChannels;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString({ view, offset: 0, str: "RIFF" });
  view.setUint32(4, 36 + dataSize, true);
  writeString({ view, offset: 8, str: "WAVE" });

  writeString({ view, offset: 12, str: "fmt " });
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bitsPerSample, true);

  writeString({ view, offset: 36, str: "data" });
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString({
  view,
  offset,
  str,
}: {
  view: DataView;
  offset: number;
  str: string;
}): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
