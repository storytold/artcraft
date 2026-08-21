# ArtCraft Omni API

> # 📚 Full API reference: **<https://storyteller-docs.netlify.app/>**
>
> **Every ArtCraft API endpoint is documented there.** This guide covers only the Omni API video
> endpoints — for everything else, start at the link above.

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

Note: Our APIs are hosted on "`api.storyteller.ai`", not "`api.getartcraft.com`". This is not a 
typo. Our Cloudflare CDN URLs are `cdn-2.fakeyou.com`.

---

## Getting an API key

Create and manage API keys from the ArtCraft web app:

1. Go to **<https://app.getartcraft.com/>**
2. Click **Account → Settings → API Keys** (your account must have API keys enabled from our staff)
3. Create a key and copy it. The secret is shown **once** — store it somewhere safe.

> **Don't see the API Keys section?** API access is gated per account. Contact the Artcraft team
> to enable it.

### What an API key looks like

- Prefix: `artcraft_api_`
- Followed by 40 random lowercase Crockford-base32 characters (`0-9 a-z`, excluding `i l o u`)
- Total length: **53 characters**, e.g. `artcraft_api_3k7q9w0xv2hs5n8m4d6r1t8y0p2s4f6h8j0k2m4n6`

Treat the key like a password: never commit it to source control or paste it into logs.

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

## Checking job status

Generation is asynchronous. The generate call returns an `inference_job_token`; poll the job-status
endpoint until the job reaches a terminal state, then read the result URL.

### Endpoints

- **Single job:** `GET /v1/omni_api/job_status/job/{token}`
- **Batch (many jobs):** `GET /v1/omni_api/job_status/batch?tokens=jinf_aaa&tokens=jinf_bbb`

Both require the same `Authorization: Bearer …` header (no cookies).

### Response shape

```json
{
  "success": true,
  "state": {
    "job_token": "jinf_xxxxxxxxxxxxxxxxxxxxxxxxx",
    "request": {
      "inference_category": "video_generation",
      "maybe_prompt_token": "prompt_xxxxxxxxxxxxxxxxxxxxxxxxx",
      "maybe_model_type": "seedance_2p0",
      "maybe_model_token": null
    },
    "status": {
      "status": "pending",
      "maybe_first_started_at": null,
      "maybe_failure_category": null,
      "progress_percentage": 0
    },
    "maybe_result": null,
    "created_at": "2026-06-24T04:06:14Z",
    "updated_at": "2026-06-24T04:06:14Z"
  }
}
```

- `state.status.status` — the job state. Keep polling while it's `pending`, `started`, or
  `attempt_failed`. **Terminal** states are `complete_success`, `complete_failure`, `dead`,
  `cancelled_by_user`, and `cancelled_by_system`.
- `state.status.progress_percentage` — an integer 0–100.
- `state.maybe_result` — `null` until the job succeeds. On `complete_success` it contains the
  finished media; the playable/downloadable URL is **`state.maybe_result.media_links.cdn_url`**.
  For video, `media_links.maybe_video_previews` also carries still/animated preview URLs.

The batch endpoint returns `{ "success": true, "job_states": [ … ] }` where each entry is the same
`state` payload as above.

### Where the result video / image lives

When `state.status.status` is `complete_success`, the finished media is under `state.maybe_result`:

- **`state.maybe_result.media_links.cdn_url`** — the primary, playable/downloadable URL of the
  finished asset. **This is the field you want.** For a video job it's the `.mp4`; for an image job
  it's the image file (`.jpg` / `.png` / etc.).
- `state.maybe_result.entity_token` — the `m_…` media-file token for the result.
- `state.maybe_result.media_links.maybe_video_previews` — **video jobs only**. Contains a `still`
  (poster `.jpg`) and an `animated` (`.gif`) preview URL, plus `{WIDTH}` thumbnail templates. This
  is `null` for image jobs.
- `state.maybe_result.media_links.maybe_thumbnail_template` — **image jobs only**. A URL template;
  replace `{WIDTH}` with a pixel width to fetch a resized thumbnail. `null` for video jobs.

**Example — completed video job:**

```json
{
  "success": true,
  "state": {
    "job_token": "jinf_9fcn2qv4dv3vvbrrxbnmfgen06v",
    "request": {
      "inference_category": "video_generation",
      "maybe_prompt_token": "prompt_q53tp4rh97qh8q159p21tazzt",
      "maybe_model_type": "seedance_2p0",
      "maybe_model_token": null
    },
    "status": {
      "status": "complete_success",
      "maybe_first_started_at": "2026-06-24T04:07:11Z",
      "maybe_failure_category": null,
      "progress_percentage": 100
    },
    "maybe_result": {
      "entity_type": "media_file",
      "entity_token": "m_ss682134tx19yhqs5y0nbnd0bd59a6",
      "media_links": {
        "cdn_url": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/8/p/n/0/4/8pn04v7q3vfhf60wy173f6awcwkre1qj/artcraft_8pn04v7q3vfhf60wy173f6awcwkre1qj.mp4",
        "maybe_thumbnail_template": null,
        "maybe_video_previews": {
          "still": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/8/p/n/0/4/8pn04v7q3vfhf60wy173f6awcwkre1qj/artcraft_8pn04v7q3vfhf60wy173f6awcwkre1qj.mp4-thumb.jpg",
          "animated": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/8/p/n/0/4/8pn04v7q3vfhf60wy173f6awcwkre1qj/artcraft_8pn04v7q3vfhf60wy173f6awcwkre1qj.mp4-thumb.gif",
          "still_thumbnail_template": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/8/p/n/0/4/8pn04v7q3vfhf60wy173f6awcwkre1qj/artcraft_8pn04v7q3vfhf60wy173f6awcwkre1qj.mp4-thumb-{WIDTH}.jpg",
          "animated_thumbnail_template": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/8/p/n/0/4/8pn04v7q3vfhf60wy173f6awcwkre1qj/artcraft_8pn04v7q3vfhf60wy173f6awcwkre1qj.mp4-thumb-{WIDTH}.gif"
        }
      },
      "maybe_successfully_completed_at": "2026-06-24T04:17:30Z"
    },
    "created_at": "2026-06-24T04:06:14Z",
    "updated_at": "2026-06-24T04:17:30Z"
  }
}
```

→ The video is at
`https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/8/p/n/0/4/8pn04v7q3vfhf60wy173f6awcwkre1qj/artcraft_8pn04v7q3vfhf60wy173f6awcwkre1qj.mp4`
(example, not a live URL).

**Example — completed image job** (from `POST /v1/omni_api/generate/image`):

```json
{
  "maybe_result": {
    "entity_type": "media_file",
    "entity_token": "m_3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6",
    "media_links": {
      "cdn_url": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/3/k/q/9/w/3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6/artcraft_3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6.jpg",
      "maybe_thumbnail_template": "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/3/k/q/9/w/3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6/artcraft_3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6.jpg-thumb-{WIDTH}.jpg",
      "maybe_video_previews": null
    },
    "maybe_successfully_completed_at": "2026-06-24T04:09:02Z"
  }
}
```

→ The image is at
`https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/3/k/q/9/w/3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6/artcraft_3kq9w0xv2hs5n8m4d6r1t8y0p2s4f6.jpg`
(example, not a live URL).

### Poll until complete

#### bash

```bash
JOB_TOKEN="jinf_xxxxxxxxxxxxxxxxxxxxxxxxx"

while :; do
  resp=$(curl -s "http://localhost:12345/v1/omni_api/job_status/job/$JOB_TOKEN" \
    -H "Authorization: Bearer YOUR_API_KEY")
  status=$(echo "$resp" | python3 -c "import sys,json;print(json.load(sys.stdin)['state']['status']['status'])")
  echo "status=$status"
  case "$status" in
    complete_success)
      echo "$resp" | python3 -c "import sys,json;print(json.load(sys.stdin)['state']['maybe_result']['media_links']['cdn_url'])"
      break ;;
    complete_failure|dead|cancelled_by_user|cancelled_by_system)
      echo "job ended without a result: $status"; break ;;
  esac
  sleep 5
done
```

#### python

```python
import time
import requests

BASE_URL = "http://localhost:12345"  # production: https://api.storyteller.ai
API_KEY = "YOUR_API_KEY"
JOB_TOKEN = "jinf_xxxxxxxxxxxxxxxxxxxxxxxxx"

TERMINAL_FAILURES = {"complete_failure", "dead", "cancelled_by_user", "cancelled_by_system"}

while True:
    resp = requests.get(
        f"{BASE_URL}/v1/omni_api/job_status/job/{JOB_TOKEN}",
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=30,
    )
    resp.raise_for_status()
    state = resp.json()["state"]
    status = state["status"]["status"]
    print("status:", status, state["status"]["progress_percentage"], "%")

    if status == "complete_success":
        print("result URL:", state["maybe_result"]["media_links"]["cdn_url"])
        break
    if status in TERMINAL_FAILURES:
        print("job ended without a result:", status)
        break
    time.sleep(5)
```

#### javascript

```javascript
const BASE_URL = "http://localhost:12345"; // production: https://api.storyteller.ai
const API_KEY = "YOUR_API_KEY";
const JOB_TOKEN = "jinf_xxxxxxxxxxxxxxxxxxxxxxxxx";

const TERMINAL_FAILURES = new Set([
  "complete_failure", "dead", "cancelled_by_user", "cancelled_by_system",
]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

while (true) {
  const resp = await fetch(`${BASE_URL}/v1/omni_api/job_status/job/${JOB_TOKEN}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const { state } = await resp.json();
  const status = state.status.status;
  console.log("status:", status, state.status.progress_percentage, "%");

  if (status === "complete_success") {
    console.log("result URL:", state.maybe_result.media_links.cdn_url);
    break;
  }
  if (TERMINAL_FAILURES.has(status)) {
    console.log("job ended without a result:", status);
    break;
  }
  await sleep(5000);
}
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
