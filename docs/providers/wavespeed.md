# WaveSpeed

## Quick start

You need the desktop app, a WaveSpeed account with credits, and an API key.
An ArtCraft account is optional for text-only image/video generation, but required
for uploaded frames/references and cloud-library features.

1. Obtain a key from [WaveSpeed API Keys](https://wavespeed.ai/accesskey).
2. Open **Settings → Accounts → WaveSpeed**, paste the key, and choose **Save key**.
   The key is saved in the OS credential store, not a plaintext app file. Unlock
   your system keychain/Secret Service if prompted.
3. Select an image or text-to-video model and choose **WaveSpeed** as its provider.
4. Enter a prompt, such as `A watercolor lighthouse on a quiet rocky coast`.
5. Generate once. Your WaveSpeed credits are charged by WaveSpeed. Without an
   ArtCraft login, the result appears in the library on this computer.

## Models and local media

WaveSpeed is available for image and video generation in the desktop app.
Add your WaveSpeed API key in **Settings → Accounts**, then select **WaveSpeed**
as the model's provider. Generations use your WaveSpeed account credits.
You can choose **Continue without an account** and generate images using your
WaveSpeed key. These images stay in this computer's local library with their
prompt, model, provider, and creation time. They appear in the image feed and
Library and support download, Save As, and deletion without cloud requests.
Local images cannot be used directly as cloud references, shared, moved into
cloud folders, or recreated through cloud-only actions. Sign in and upload an
image first to use it as a reference. Account-free text-to-video generation also
saves MP4 results locally, with container and size checks. Sign in to use uploaded
starting/ending frames or reference media. Other providers still require an
ArtCraft session before submission.
The app remembers the selected model, provider, and image count across restarts.

Image defaults are square, medium quality where selectable, and the resolution
shown first. Basic ratios are 1:1, 4:3, 16:9, 3:4, and 9:16. Extended ratios also
include 3:2, 2:3, 5:4, 4:5, and 21:9. Native means there is no resolution control.

| Image model            | Max batch | Max references | Resolution choices | Ratios             |
|------------------------|-----------|----------------|--------------------|--------------------|
| FLUX Dev               | 4         | 1              | Native             | Basic              |
| FLUX Schnell           | 4         | 1              | Native             | Basic              |
| FLUX 1.1 Pro           | 1         | 0              | Native             | Basic              |
| FLUX 1.1 Pro Ultra     | 1         | 0              | Native             | Basic              |
| Nano Banana            | 1         | 10             | Native             | Extended           |
| Nano Banana 2          | 1         | 14             | 1K, 0.5K, 2K, 4K   | Extended           |
| Nano Banana Pro        | 1         | 14             | 1K, 2K, 4K         | Extended           |
| Seedream 4             | 1         | 10             | 2K, 3K, 4K         | Extended           |
| Seedream 4.5           | 1         | 10             | 2K, 3K, 4K         | Extended           |
| Seedream 5 Lite        | 1         | 10             | 2K, 3K, 4K         | Extended           |
| GPT Image 1.5          | 1         | 10             | Native             | 1:1, 3:2, 2:3      |
| GPT Image 2            | 1         | 16             | 1K, 2K, 4K         | Extended           |
| GPT Image 2.5 Flare    | 1         | 16             | 1K, 2K, 4K         | Extended plus 9:21 |
| GPT Image 2.5 Sunburst | 1         | 16             | 1K, 2K, 4K         | Extended plus 9:21 |

Videos produce one clip per request and default to 16:9. Resolution defaults to
720p when available, otherwise the first choice below; Native has no resolution
control. All models accept one starting frame, required for rows marked Yes.
Sora/Veo offer 16:9 and 9:16; Kling also offers 1:1; Seedance/MiniMax also offer
4:3, 3:4, and 21:9. MiniMax H3 and Seedance 2.5 are available only through WaveSpeed.

| Video model         | Duration (default)    | Resolutions           | Frame required | End frame |
|---------------------|-----------------------|-----------------------|----------------|-----------|
| Kling 1.6 Pro       | 5, 10 (5s)            | Native                | Yes            | Yes       |
| Kling 2.1 Pro       | 5, 10 (5s)            | Native                | Yes            | No        |
| Kling 2.1 Master    | 5, 10 (5s)            | Native                | No             | No        |
| Kling 2.5 Turbo Pro | 5, 10 (5s)            | Native                | No             | Yes       |
| Kling 2.6 Pro       | 5, 10 (5s)            | Native                | No             | Yes       |
| Kling 3 Standard    | 3–15 (5s)             | Native                | Yes            | Yes       |
| Kling 3 Pro         | 3–15 (5s)             | Native                | Yes            | Yes       |
| Seedance 1 Lite     | 2–12 (5s)             | 720p                  | No             | Yes       |
| Seedance 1.5 Pro    | 4–12 (5s)             | 480p, 720p, 1080p     | No             | Yes       |
| Seedance 2          | 4–15 (5s)             | 480p, 720p, 1080p, 4K | No             | Yes       |
| Seedance 2 Fast     | 4–15 (5s)             | 480p, 720p, 1080p, 4K | No             | Yes       |
| Seedance 2.5        | 4–30 (5s)             | 480p, 720p, 1080p, 4K | No             | Yes       |
| MiniMax H3          | 4–15 (5s)             | 2K                    | No             | Yes       |
| Sora 2              | 4, 8, 12, 16, 20 (4s) | 720p                  | No             | No        |
| Sora 2 Pro          | 4, 8, 12, 16, 20 (4s) | 720p, 1080p           | No             | No        |
| Veo 3               | 4, 6, 8 (8s)          | 720p, 1080p           | No             | No        |
| Veo 3 Fast          | 4, 6, 8 (8s)          | 720p, 1080p           | No             | No        |
| Veo 3.1             | 4, 6, 8 (8s)          | 720p, 1080p, 4K       | No             | Yes       |
| Veo 3.1 Fast        | 4, 6, 8 (8s)          | 720p, 1080p, 4K       | No             | Yes       |

Kling prompts are limited to 2,500 characters. Sign in to attach required frames.
Kling 2.6 ending-frame generation requires sound to be disabled.
Veo outputs above 720p require an eight-second duration.
WaveSpeed **Seedance 2.0** additionally supports Omni Reference, Edit video, and
Extend video. Choose Omni Reference, then select the WaveSpeed mode. Reference
mode accepts up to nine images, three videos, and three audio clips. Edit and
extend require exactly one input video; extend does not accept image/audio
references. Reference-mode video and audio inputs are limited to 15 seconds
combined per kind, checked against cloud media metadata before submission.
Edit/Extend source videos do not inherit that reference-video limit. Edit may also use
image/audio references. Prompt mentions use `@Image 1`, `@Video 1`, and `@Audio 1`.
These modes are not exposed for other models without verified endpoint contracts.
Masks remain unsupported.

After signing in, open a local image and choose **Upload to cloud library**.
This uploads only that image, retains the original local file and metadata, and
stores upload progress separately for each verified account and API host. A retry
reuses the upload identity. Local video import is not exposed yet.

Jobs are tracked locally and polled after restarting the app; completed images
and videos use the existing download, ArtCraft upload, and gallery notification flow
when signed in. Media submitted without an account remains local even if you
sign in before they complete.
Upload progress, batch identity, and per-result idempotency keys are saved before
uploading and bound to the verified ArtCraft account. Sign back in to that account
to resume after an account switch. Restarted jobs skip confirmed uploads and reuse keys after lost responses;
this relies on the ArtCraft server honoring those keys. Captured completion URLs
can be resumed without polling WaveSpeed again or retaining its API key.
Completed output bytes are cached atomically before upload and retained until the
task database confirms completion. Upload retries and automatic downloads reuse
these bytes even when the provider URL has expired. Transfers stream with HTTP
error checking, a 1 GiB per-file limit, at most 16 outputs, and finite timeouts.
Output URLs must be HTTP(S) with public-network destinations. Redirects and
private-network addresses are rejected. Local-library images additionally
require valid PNG, JPEG, WebP, or GIF bytes within image decoding limits.
An abrupt process kill can leave an unfinished temporary file behind.
Late provider responses cannot change a task that is already terminal or cancelled.
An ArtCraft session is required for uploading results to the gallery.
Local Save As accepts only safe image/MP4 filenames and never overwrites an existing
file; choose a new name if it already exists. Asset downloads are confined to the
app's registered local-library files, not arbitrary files on disk.
Submissions are never retried automatically. After an uncertain submission failure,
check your WaveSpeed history before submitting again to avoid a duplicate charge.

Submission receipts are saved before calling WaveSpeed. Once an acceptance ID is
received, the receipt and frontend metadata allow automatic task recovery after
database failure or restart, without duplicating task rows. An interrupted request
whose acceptance response was never recorded is **not** resubmitted. In
**Settings → Accounts → WaveSpeed → Check unfinished submissions**, paste the
matching prediction ID from WaveSpeed History to resume it without another paid
generation. Receipts are scoped to the original ArtCraft API host.
Explicit HTTP authentication, billing, validation, and rate-limit rejections do
not stay in the unfinished list. Timeouts, server errors, and ambiguous success
envelopes retain their receipts because acceptance cannot be ruled out.

On startup and every ten minutes, the polling thread removes caches for confirmed
terminal/cancelled tasks and provider partial downloads older than 24 hours. It
preserves pending outputs, uncertain submission receipts, and unrelated files.

## Troubleshooting

| Problem                      | What to do                                                                   |
|------------------------------|------------------------------------------------------------------------------|
| No API key                   | Add a key in Settings → Accounts → WaveSpeed.                                |
| Authentication failed        | Replace the key with an active WaveSpeed API key.                            |
| Insufficient credits         | Check your WaveSpeed balance; ArtCraft credits do not fund these requests.   |
| Credential store unavailable | Unlock your system keychain or enable an unlocked Secret Service on Linux.   |
| Rate limit                   | Wait; polling backs off and respects WaveSpeed's numeric Retry-After value.  |
| Uncertain submission         | Check WaveSpeed History and recover the existing prediction ID in Settings.  |
| Original account required    | Sign in to the ArtCraft account that started the cloud upload.               |
| Invalid local media          | Use a supported PNG/JPEG/WebP/GIF image or MP4 video within the size limits. |
| Unreadable upload progress   | Recovery stops to avoid duplicate uploads; check the cloud/provider history. |

See [release checks](../testing/wavespeed.md) for developer-only validation steps.

API references: [Nano Banana Pro](https://wavespeed.ai/docs/docs-api/google/google-nano-banana-pro-text-to-image),
[Seedream 4.5](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedream-v4.5),
[GPT Image 2.5](https://wavespeed.ai/docs/docs-api/openai/openai-gpt-image-2.5-flare-text-to-image),
[MiniMax H3](https://wavespeed.ai/docs/docs-api/minimax/minimax-h3-text-to-video),
[Seedance 2.5](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.5-text-to-video),
[Seedance 2.0 references](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.0-reference-to-video),
[Seedance 2.0 edit](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.0-video-edit),
[Seedance 2.0 extend](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.0-video-extend),
and [Veo 3.1](https://wavespeed.ai/docs/docs-api/google/google-veo3.1-text-to-video).
