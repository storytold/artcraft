// Master-bus limiter for the audio playback + export buses. Single
// DynamicsCompressor + post-gain set to OUTPUT_HEADROOM keeps overall
// loudness within the limiter's safe band so we don't get clipping
// when several clips with normal gain levels overlap. The
// applyAudioMasteringToBuffer offline pass is used by export +
// waveform pre-render; the realtime chain is built per playback context.
//
// `applyAudioMasteringToBuffer` is a no-op when the input peak is
// already below headroom — avoids unnecessary OfflineAudioContext
// rendering for material that doesn't need limiting.

const MASTER_LIMITER_THRESHOLD_DB = -1;
const MASTER_LIMITER_KNEE_DB = 0;
const MASTER_LIMITER_RATIO = 20;
const MASTER_LIMITER_ATTACK_SECONDS = 0.001;
const MASTER_LIMITER_RELEASE_SECONDS = 0.12;
const MASTER_OUTPUT_HEADROOM = 0.98;

export function getAudioBufferPeak({
  audioBuffer,
}: {
  audioBuffer: AudioBuffer;
}): number {
  let peak = 0;

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let index = 0; index < channelData.length; index++) {
      const magnitude = Math.abs(channelData[index]);
      if (magnitude > peak) {
        peak = magnitude;
      }
    }
  }

  return peak;
}

export function createAudioMasteringChain({
  audioContext,
  destination,
}: {
  audioContext: AudioContext | OfflineAudioContext;
  destination: AudioNode;
}): {
  input: GainNode;
} {
  const input = audioContext.createGain();
  const limiter = audioContext.createDynamicsCompressor();
  const outputGain = audioContext.createGain();

  limiter.threshold.value = MASTER_LIMITER_THRESHOLD_DB;
  limiter.knee.value = MASTER_LIMITER_KNEE_DB;
  limiter.ratio.value = MASTER_LIMITER_RATIO;
  limiter.attack.value = MASTER_LIMITER_ATTACK_SECONDS;
  limiter.release.value = MASTER_LIMITER_RELEASE_SECONDS;
  outputGain.gain.value = MASTER_OUTPUT_HEADROOM;

  input.connect(limiter);
  limiter.connect(outputGain);
  outputGain.connect(destination);

  return { input };
}

export async function applyAudioMasteringToBuffer({
  audioBuffer,
}: {
  audioBuffer: AudioBuffer;
}): Promise<AudioBuffer> {
  if (getAudioBufferPeak({ audioBuffer }) <= MASTER_OUTPUT_HEADROOM) {
    return audioBuffer;
  }

  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.max(1, audioBuffer.length),
    audioBuffer.sampleRate,
  );
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;

  const { input } = createAudioMasteringChain({
    audioContext: offlineContext,
    destination: offlineContext.destination,
  });
  source.connect(input);
  source.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  clampAudioBufferPeak({
    audioBuffer: renderedBuffer,
    maxPeak: MASTER_OUTPUT_HEADROOM,
  });
  return renderedBuffer;
}

function clampAudioBufferPeak({
  audioBuffer,
  maxPeak,
}: {
  audioBuffer: AudioBuffer;
  maxPeak: number;
}): void {
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let index = 0; index < channelData.length; index++) {
      channelData[index] = Math.max(
        -maxPeak,
        Math.min(maxPeak, channelData[index]),
      );
    }
  }
}
