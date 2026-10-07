# Supported Audio & Voice Synthesis Models

The ArtCraft MCP server provides end-to-end audio, musical composition, and voice synthesis capabilities through native Model Context Protocol tools.

---

## 1. Suno AI Music & Ambient Audio (`artcraft_generate_audio`)

Enqueues generative audio and musical track generation powered by Suno AI.

### Parameters:
- **`prompt`** (Required): Detailed text description of the music, sonic texture, instruments, or lyrics.
  - *Instrumental example*: `"Late night lo-fi chillhop beat, warm rhodes chords, dusty vinyl crackle, gentle sidechain bass, 85 bpm"`
  - *Vocal example*: `"[Verse 1]\nNeon signs flicker in the rain...\n[Chorus]\nLost in the frequency tonight"`
- **`tags`** (Optional): Genre, mood, or instrumentation styling tags (e.g. `"synthwave, retro, 80s analog, uptempo"`).
- **`duration_seconds`** (Optional): Duration in seconds (e.g. 30, 60, 120).
- **`is_custom`** (Optional): Boolean flag (`true` when providing structured lyrics/sections).

### Agent Best Practices:
1. Always advise users whether they want an instrumental track or vocal composition.
2. Pre-generate or format lyric tags (`[Verse]`, `[Chorus]`, `[Drop]`, `[Outro]`) to improve musical structure.

---

## 2. Text-to-Speech (`artcraft_tts_generate`)

Synthesizes realistic spoken speech from text scripts.

### Parameters:
- **`text`** (Required): Spoken script text.
- **`voice_token`** (Optional): Target voice profile token.
- **`model`** (Optional): Underlying TTS acoustic model.

### Related Discovery Tools:
- **`artcraft_tts_search_models`**: Query available TTS voices and linguistic models.
- **`artcraft_list_voices`**: View the user's custom saved voices and system stock voices.

---

## 3. Voice Conversion & Cloning (`artcraft_voice_convert`)

Converts existing vocal tracks into target character voices using neural voice conversion.

### Parameters:
- **`source_audio_media_token`** (Required): Media token of input vocal audio (upload via `artcraft_upload_audio`).
- **`target_voice_token`** (Required): Voice token to transform speech into.
- **`model`** (Optional): Voice conversion pipeline model.

### Voice Sample Onboarding:
- Use **`artcraft_upload_voice_sample`** to upload clean, dry spoken audio samples for training custom voice models.
- Use **`artcraft_create_voice_dataset`** to aggregate uploaded samples into a trainable dataset.
