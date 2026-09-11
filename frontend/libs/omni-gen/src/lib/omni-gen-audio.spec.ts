import { describe, expect, it } from "vitest";
import type { OmniGenAudioModelDetails } from "@storyteller/api";
import { buildAudioRequest, type AudioGenerationSettings } from "./omni-gen-audio";

// Per-model capability fixtures mirroring the backend's audio_models config.
const SUNO_MUSIC: OmniGenAudioModelDetails = {
  model: "suno_music",
  text_prompt_supported: true,
  style_prompt_supported: true,
  instrumental_toggle_supported: true,
};

const SUNO_REMIX: OmniGenAudioModelDetails = {
  model: "suno_remix",
  text_prompt_supported: true,
  style_prompt_supported: true,
  keep_lyrics_supported: true,
  audio_references_supported: true,
  audio_references_max: 1,
};

const SUNO_SOUNDS: OmniGenAudioModelDetails = {
  model: "suno_sounds",
  text_prompt_supported: true,
  loopable_toggle_supported: true,
  bpm_supported: true,
  musical_key_supported: true,
};

const SEED_AUDIO: OmniGenAudioModelDetails = {
  model: "seed_audio_1p0",
  text_prompt_supported: true,
  audio_references_supported: true,
  audio_references_max: 3,
  image_references_supported: true,
  image_references_max: 1,
  sample_rate_hz_options: [8000, 16000, 24000, 32000, 44100, 48000],
  sample_rate_hz_default: 24000,
  speed_supported: true,
  volume_supported: true,
  pitch_supported: true,
};

const BASE_SETTINGS: AudioGenerationSettings = {
  prompt: "a driving synthwave anthem",
  stylePrompt: "dreamy synth-pop, female vocals",
  audioMediaTokens: ["mf_audio1"],
  imageMediaTokens: ["mf_image1"],
  isInstrumental: true,
  keepLyrics: true,
  isLoopable: true,
  bpm: 128,
  musicalKey: "a_minor",
  sampleRateHz: 44100,
  speed: 1.25,
  volume: 0.8,
  pitch: -2,
};

describe("buildAudioRequest capability gating", () => {
  it("suno_music sends prompts + instrumental but no refs or beat/tuning params", () => {
    const request = buildAudioRequest(SUNO_MUSIC, BASE_SETTINGS);
    expect(request.model).toBe("suno_music");
    expect(request.prompt).toBe(BASE_SETTINGS.prompt);
    expect(request.style_prompt).toBe(BASE_SETTINGS.stylePrompt);
    expect(request.is_instrumental).toBe(true);
    expect(request.audio_media_tokens).toBeNull();
    expect(request.image_media_tokens).toBeNull();
    expect(request.keep_lyrics).toBeNull();
    expect(request.is_loopable).toBeNull();
    expect(request.bpm).toBeNull();
    expect(request.musical_key).toBeNull();
    expect(request.sample_rate_hz).toBeNull();
    expect(request.speed).toBeNull();
    expect(request.volume).toBeNull();
    expect(request.pitch).toBeNull();
  });

  it("suno_remix sends the audio reference + keep_lyrics but never style-less extras", () => {
    const request = buildAudioRequest(SUNO_REMIX, BASE_SETTINGS);
    expect(request.audio_media_tokens).toEqual(["mf_audio1"]);
    expect(request.keep_lyrics).toBe(true);
    expect(request.image_media_tokens).toBeNull();
    expect(request.is_instrumental).toBeNull();
    expect(request.bpm).toBeNull();
  });

  it("suno_sounds sends beat controls but never a style prompt", () => {
    const request = buildAudioRequest(SUNO_SOUNDS, BASE_SETTINGS);
    expect(request.style_prompt).toBeNull();
    expect(request.is_loopable).toBe(true);
    expect(request.bpm).toBe(128);
    expect(request.musical_key).toBe("a_minor");
    expect(request.audio_media_tokens).toBeNull();
  });

  it("suno_sounds omits bpm when set to Auto (null)", () => {
    const request = buildAudioRequest(SUNO_SOUNDS, {
      ...BASE_SETTINGS,
      bpm: null,
    });
    expect(request.bpm).toBeNull();
    expect(request.musical_key).toBe("a_minor");
  });

  it("seed_audio sends tuning params + refs but never Suno toggles", () => {
    const request = buildAudioRequest(SEED_AUDIO, BASE_SETTINGS);
    expect(request.sample_rate_hz).toBe(44100);
    expect(request.speed).toBe(1.25);
    expect(request.volume).toBe(0.8);
    expect(request.pitch).toBe(-2);
    expect(request.audio_media_tokens).toEqual(["mf_audio1"]);
    expect(request.image_media_tokens).toEqual(["mf_image1"]);
    expect(request.is_instrumental).toBeNull();
    expect(request.keep_lyrics).toBeNull();
    expect(request.is_loopable).toBeNull();
    expect(request.style_prompt).toBeNull();
  });

  it("omits empty prompts and reference arrays", () => {
    const request = buildAudioRequest(SUNO_MUSIC, {
      ...BASE_SETTINGS,
      prompt: "  ",
      stylePrompt: "",
      audioMediaTokens: [],
      imageMediaTokens: [],
    });
    expect(request.prompt).toBeNull();
    expect(request.style_prompt).toBeNull();
    expect(request.audio_media_tokens).toBeNull();
  });

  it("always includes a fresh idempotency token", () => {
    const first = buildAudioRequest(SUNO_MUSIC, BASE_SETTINGS);
    const second = buildAudioRequest(SUNO_MUSIC, BASE_SETTINGS);
    expect(first.idempotency_token).toBeTruthy();
    expect(second.idempotency_token).toBeTruthy();
    expect(first.idempotency_token).not.toBe(second.idempotency_token);
  });
});
