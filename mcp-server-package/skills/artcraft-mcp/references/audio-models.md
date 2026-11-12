# Audio, TTS & Voice Models

## `artcraft_generate_audio` (paid, `confirm` required)

| Model            | Aliases           | Use for                        |
|------------------|-------------------|--------------------------------|
| `suno_music`     | `suno`, `music`   | Full songs (default)           |
| `suno_remix`     | `remix`           | Remix an uploaded track        |
| `suno_sounds`    | `sounds`, `sfx`   | Sound effects / one-shots      |
| `suno_sample`    | `sample`          | Sample-style generation        |
| `seed_audio_1p0` | `seed_audio`      | Seed Audio 1.0                 |

Parameters: `prompt` (lyrics/description, ≤8000 chars), `style_prompt`
(genre tags ≤2000), `audio_media_tokens` / `image_media_tokens` (≤16),
`keep_lyrics`, `is_instrumental`, `is_loopable`, `bpm` (30-300),
`musical_key`, `sample_rate_hz` (8000/16000/24000/32000/44100/48000),
`speed`/`volume` (0.5-2.0), `pitch` (-12..12).

`musical_key` values: `auto`, `c_major`, `c_minor`, `d_major`, `d_minor`,
`f_major`, `f_minor`, `g_major`, `g_minor`, `a_major`, `a_minor`,
`b_major`, `b_minor`. (Only these variants exist — no E keys.)

## `artcraft_tts_generate` (paid)

| Parameter           | Notes                                       |
|---------------------|---------------------------------------------|
| `text`              | Text to synthesize                          |
| `tts_model_token`   | TTS model/weight token                      |

Discover models with `artcraft_tts_search_models` (`query`, `limit`) —
it searches the weights catalog for `text_to_speech` entries.

## Voice tools

- `artcraft_voice_convert` — convert audio via a trained voice model
  (`audio_media_token`, `model_token`, paid/confirm).
- `artcraft_list_voice_conversion_models` — list available models.
- `artcraft_create_voice` (`name`, `description`, `confirm`) /
  `artcraft_list_voices` / `artcraft_get_voice` (if present) — manage
  custom voices.
- `artcraft_create_voice_dataset` (`name`, `confirm`) /
  `artcraft_upload_voice_sample` (`file_path`, `dataset_token`, `confirm`)
  — build a dataset from local audio files (audio extension allowlist,
  size cap applies).
