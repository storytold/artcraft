# ArtCraft Omni API

The **Omni API** is the API-key–authenticated surface for ArtCraft generation. It mirrors the
in-app "Omni Gen" endpoints but is designed for programmatic use: you authenticate with an API key
in the `Authorization` header instead of a browser session cookie.

This guide covers **video generation from URL inputs** — passing image, video, and audio reference
URLs directly. The server downloads each URL, stores it as a media file on your account, and then
runs generation against it. You never have to upload files yourself.

> All examples send **no cookies**. The Omni API is authenticated purely by your API key. If you
> send session cookies they are ignored.

---

## Base URLs

| Environment   | Base URL                       |
| ------------- | ------------------------------ |
| Development   | `http://localhost:12345`       |
| Production    | `https://api.storyteller.ai`   |

All paths below are relative to the base URL (e.g. `POST /v1/omni_api/generate/video`).

The examples in this guide use the **development** base URL. To run against production, swap
`http://localhost:12345` for `https://api.storyteller.ai`.

---

## Getting an API key

API keys are created from a logged-in session. You only need to do this once; store the key
somewhere safe.

1. **Log in** to obtain a session (browser, or the `/v1/login` endpoint).
2. **Create a key** by calling `POST /v1/api_keys/create` with your session:

   ```bash
   curl -s -c /tmp/cookies.txt -X POST http://localhost:12345/v1/login \
     -H "Content-Type: application/json" \
     -d '{"username_or_email":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'

   curl -s -b /tmp/cookies.txt -X POST http://localhost:12345/v1/api_keys/create \
     -H "Content-Type: application/json" \
     -d '{"name":"my-integration","maybe_description":"server-to-server video gen"}'
   ```

   The response returns the secret **once** — it can never be retrieved again:

   ```json
   {
     "success": true,
     "api_key_token": "api_key_xxxxxxxxxxxxxxxxxxxxxxxxx",
     "api_key": "artcraft_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   }
   ```

   - `api_key` — the **secret**. Store it now; treat it like a password. This is the value you put
     in the `Authorization` header.
   - `api_key_token` — a non-secret handle (prefix `api_key_`) used to manage the key later
     (get / update / delete). Safe to log and store.

> **403 Forbidden when creating a key?** API-key creation is gated per account. Contact the
> Storyteller team to enable API access for your account.

### What an API key looks like

- Prefix: `artcraft_api_`
- Followed by 40 random lowercase Crockford-base32 characters (`0-9 a-z`, excluding `i l o u`)
- Total length: **53 characters**, e.g. `artcraft_api_3k7q9w0xv2hs5n8m4d6r1t8y0p2s4f6h8j0k2m4n6`

Never commit a key to source control or paste it into logs.

---

## Authentication

Send the secret key in the `Authorization` header. Three forms are accepted:

```
Authorization: Bearer artcraft_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Authorization: Key artcraft_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Authorization: artcraft_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`Bearer` is recommended. **Do not send cookies.**

---

## Video generation — `POST /v1/omni_api/generate/video`

Generates a video and returns an inference job token you can poll for results.

### Request body

| Field                        | Type            | Notes |
| ---------------------------- | --------------- | ----- |
| `model`                      | string          | Generation model, e.g. `seedance_2p0`. **Required.** |
| `prompt`                     | string          | Text prompt. |
| `duration_seconds`           | integer         | Length of the output video, e.g. `6`. |
| `aspect_ratio`               | string          | e.g. `wide_sixteen_by_nine`, `tall_nine_by_sixteen`, `square`. |
| `idempotency_token`          | string (UUID)   | **Required.** A fresh UUID per request; prevents accidental duplicates. |
| `negative_prompt`            | string          | Optional. |
| `resolution`                 | string          | Optional, e.g. `seven_twenty_p`, `ten_eighty_p`. |
| `generate_audio`             | boolean         | Optional. |
| **URL inputs** (this guide)  |                 | |
| `start_frame_image_url`      | string (URL)    | Starting keyframe image. |
| `end_frame_image_url`        | string (URL)    | Ending keyframe image. |
| `reference_image_urls`       | array of URL    | Reference images. |
| `reference_video_urls`       | array of URL    | Reference videos (`mp4`). |
| `reference_audio_urls`       | array of URL    | Reference audio (`wav`, `mp3`, `ogg`, …). |
| **Media-token inputs**       |                 | |
| `start_frame_image_media_token`, `end_frame_image_media_token`, `reference_image_media_tokens`, `reference_video_media_tokens`, `reference_audio_media_tokens` | token(s) | Use these instead if you've already uploaded media. |

#### Rules for URL inputs

- Each URL field and its media-token counterpart are **mutually exclusive**. Sending both
  `reference_image_urls` and `reference_image_media_tokens`, for example, returns:
  `Either reference_image_media_tokens or reference_image_urls must be set, not both`.
- Every URL must start with `http://` or `https://`, otherwise:
  `URL must start with http:// or https://, bad URL: <url>`.
- Redirects are followed (up to 10), so CDN/redirecting URLs work.
- The file type is detected from the downloaded bytes. Images must be a real image
  (`jpeg`/`png`/`gif`/`webp`), reference videos must be `mp4`, reference audio must be a
  supported audio type (`wav`, `mp3`, `aac`, `ogg`, `flac`, …).

### Response

```json
{
  "success": true,
  "inference_job_token": "jinf_xxxxxxxxxxxxxxxxxxxxxxxxx",
  "all_job_tokens": ["jinf_xxxxxxxxxxxxxxxxxxxxxxxxx"]
}
```

Use `inference_job_token` to poll for the finished video. `all_job_tokens` lists every job created
(batch requests can create more than one).

---

## Examples

The examples reuse these public sample URLs:

- Images (Wikimedia Commons): an Atlantic puffin, the Matterhorn, a toco toucan
- Video: a short sample `mp4`
- Audio: a short sample `wav`

Replace `YOUR_API_KEY` with your `artcraft_api_…` secret, and generate a fresh `idempotency_token`
(UUID) for every request.

---

### Example 1 — Starting-frame Seedance (`start_frame_image_url`)

Animate outward from a single starting image.

#### bash

```bash
curl -s -X POST http://localhost:12345/v1/omni_api/generate/video \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance_2p0",
    "prompt": "An Atlantic puffin stands on a windy cliff edge and turns its head as morning light catches its colorful beak.",
    "duration_seconds": 6,
    "aspect_ratio": "wide_sixteen_by_nine",
    "idempotency_token": "'"$(uuidgen)"'",
    "start_frame_image_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900"
  }'
```

#### python

```python
import uuid
import requests

BASE_URL = "http://localhost:12345"  # production: https://api.storyteller.ai
API_KEY = "YOUR_API_KEY"

resp = requests.post(
    f"{BASE_URL}/v1/omni_api/generate/video",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "seedance_2p0",
        "prompt": "An Atlantic puffin stands on a windy cliff edge and turns its head as morning light catches its colorful beak.",
        "duration_seconds": 6,
        "aspect_ratio": "wide_sixteen_by_nine",
        "idempotency_token": str(uuid.uuid4()),
        "start_frame_image_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
    },
    timeout=240,
)
resp.raise_for_status()
print(resp.json())
```

#### javascript

```javascript
import { randomUUID } from "node:crypto";

const BASE_URL = "http://localhost:12345"; // production: https://api.storyteller.ai
const API_KEY = "YOUR_API_KEY";

const resp = await fetch(`${BASE_URL}/v1/omni_api/generate/video`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "seedance_2p0",
    prompt:
      "An Atlantic puffin stands on a windy cliff edge and turns its head as morning light catches its colorful beak.",
    duration_seconds: 6,
    aspect_ratio: "wide_sixteen_by_nine",
    idempotency_token: randomUUID(),
    start_frame_image_url:
      "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
  }),
});

console.log(resp.status, await resp.json());
```

---

### Example 2 — Image-reference Seedance (`reference_image_urls`)

Guide the generation with one or more reference images.

#### bash

```bash
curl -s -X POST http://localhost:12345/v1/omni_api/generate/video \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance_2p0",
    "prompt": "A whimsical journey: an Atlantic puffin perches on a cliff beneath the snow-capped Matterhorn while a brilliant toco toucan watches from a misty rainforest canopy.",
    "duration_seconds": 6,
    "aspect_ratio": "wide_sixteen_by_nine",
    "idempotency_token": "'"$(uuidgen)"'",
    "reference_image_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Toco_toucan.jpg?width=900"
    ]
  }'
```

#### python

```python
import uuid
import requests

BASE_URL = "http://localhost:12345"  # production: https://api.storyteller.ai
API_KEY = "YOUR_API_KEY"

resp = requests.post(
    f"{BASE_URL}/v1/omni_api/generate/video",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "seedance_2p0",
        "prompt": "A whimsical journey: an Atlantic puffin perches on a cliff beneath the snow-capped Matterhorn while a brilliant toco toucan watches from a misty rainforest canopy.",
        "duration_seconds": 6,
        "aspect_ratio": "wide_sixteen_by_nine",
        "idempotency_token": str(uuid.uuid4()),
        "reference_image_urls": [
            "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
            "https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=900",
            "https://commons.wikimedia.org/wiki/Special:FilePath/Toco_toucan.jpg?width=900",
        ],
    },
    timeout=240,
)
resp.raise_for_status()
print(resp.json())
```

#### javascript

```javascript
import { randomUUID } from "node:crypto";

const BASE_URL = "http://localhost:12345"; // production: https://api.storyteller.ai
const API_KEY = "YOUR_API_KEY";

const resp = await fetch(`${BASE_URL}/v1/omni_api/generate/video`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "seedance_2p0",
    prompt:
      "A whimsical journey: an Atlantic puffin perches on a cliff beneath the snow-capped Matterhorn while a brilliant toco toucan watches from a misty rainforest canopy.",
    duration_seconds: 6,
    aspect_ratio: "wide_sixteen_by_nine",
    idempotency_token: randomUUID(),
    reference_image_urls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Toco_toucan.jpg?width=900",
    ],
  }),
});

console.log(resp.status, await resp.json());
```

---

### Example 3 — Image + video reference Seedance (`reference_image_urls` + `reference_video_urls`)

Combine reference images with a reference video (and, optionally, reference audio). This is the
fullest URL-driven request.

#### bash

```bash
curl -s -X POST http://localhost:12345/v1/omni_api/generate/video \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "seedance_2p0",
    "prompt": "An Atlantic puffin stands on a windy cliff edge; the scene sweeps up to the snow-capped Matterhorn at sunrise before settling on a brilliant toco toucan in a misty rainforest canopy. The camera glides with the motion of the reference video, set to the mood of the reference audio.",
    "duration_seconds": 6,
    "aspect_ratio": "wide_sixteen_by_nine",
    "idempotency_token": "'"$(uuidgen)"'",
    "reference_image_urls": [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Toco_toucan.jpg?width=900"
    ],
    "reference_video_urls": ["https://download.samplelib.com/mp4/sample-5s.mp4"],
    "reference_audio_urls": ["https://download.samplelib.com/wav/sample-6s.wav"]
  }'
```

#### python

```python
import uuid
import requests

BASE_URL = "http://localhost:12345"  # production: https://api.storyteller.ai
API_KEY = "YOUR_API_KEY"

resp = requests.post(
    f"{BASE_URL}/v1/omni_api/generate/video",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "model": "seedance_2p0",
        "prompt": "An Atlantic puffin stands on a windy cliff edge; the scene sweeps up to the snow-capped Matterhorn at sunrise before settling on a brilliant toco toucan in a misty rainforest canopy. The camera glides with the motion of the reference video, set to the mood of the reference audio.",
        "duration_seconds": 6,
        "aspect_ratio": "wide_sixteen_by_nine",
        "idempotency_token": str(uuid.uuid4()),
        "reference_image_urls": [
            "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
            "https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=900",
            "https://commons.wikimedia.org/wiki/Special:FilePath/Toco_toucan.jpg?width=900",
        ],
        "reference_video_urls": ["https://download.samplelib.com/mp4/sample-5s.mp4"],
        "reference_audio_urls": ["https://download.samplelib.com/wav/sample-6s.wav"],
    },
    timeout=240,
)
resp.raise_for_status()
print(resp.json())
```

#### javascript

```javascript
import { randomUUID } from "node:crypto";

const BASE_URL = "http://localhost:12345"; // production: https://api.storyteller.ai
const API_KEY = "YOUR_API_KEY";

const resp = await fetch(`${BASE_URL}/v1/omni_api/generate/video`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "seedance_2p0",
    prompt:
      "An Atlantic puffin stands on a windy cliff edge; the scene sweeps up to the snow-capped Matterhorn at sunrise before settling on a brilliant toco toucan in a misty rainforest canopy. The camera glides with the motion of the reference video, set to the mood of the reference audio.",
    duration_seconds: 6,
    aspect_ratio: "wide_sixteen_by_nine",
    idempotency_token: randomUUID(),
    reference_image_urls: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Puffin_%28Fratercula_arctica%29.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Matterhorn_from_Domh%C3%BCtte_-_2.jpg?width=900",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Toco_toucan.jpg?width=900",
    ],
    reference_video_urls: ["https://download.samplelib.com/mp4/sample-5s.mp4"],
    reference_audio_urls: ["https://download.samplelib.com/wav/sample-6s.wav"],
  }),
});

console.log(resp.status, await resp.json());
```

---

## Notes & troubleshooting

- **Always send a fresh `idempotency_token`** (UUID). Reusing one is rejected as a duplicate.
- **No cookies.** The endpoint authenticates only via the `Authorization` header.
- **URL must be `http(s)`** and reachable by the server; redirects are followed.
- **Type mismatches** (e.g. a `.webm` passed as a reference video, which requires `mp4`) are
  rejected with a `400` describing the unpermitted type.
- **`401 Unauthorized`** — missing/invalid API key, or the key's owner is banned.
- **`402 Payment required`** — insufficient credits/balance.
- There is a companion image endpoint, `POST /v1/omni_api/generate/image`, which accepts
  `image_urls` (mutually exclusive with `image_media_tokens`) following the same rules.
