declare module "soundtouchjs" {
  export class PitchShifter {
    constructor(
      context: BaseAudioContext,
      buffer: AudioBuffer,
      bufferSize: number,
      onEnd?: () => void,
    );
    tempo: number;
    pitch: number;
    connect(destination: AudioNode): void;
    off(): void;
  }
}
