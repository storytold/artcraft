# WaveSpeed

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

Supported image models: FLUX Dev/Schnell, FLUX 1.1 Pro/Ultra, Nano Banana/2/Pro,
Seedream 4/4.5/5 Lite, and GPT Image 1.5/2/2.5 Flare/2.5 Sunburst. Each model uses
its own reference-image, aspect-ratio, resolution, and quality limits. FLUX
Dev/Schnell support batches of up to four; other image endpoints produce one image.

Supported video models: MiniMax H3, Seedance 1 Lite/1.5 Pro/2/2 Fast/2.5,
Kling 1.6 Pro/2.1 Pro/2.1 Master/2.5 Turbo Pro/2.6 Pro/3 Standard/3 Pro,
Sora 2/2 Pro, and Veo 3/3 Fast/3.1/3.1 Fast. MiniMax H3 uses the official
`minimax/h3` endpoints at 2K; Seedance 2.5 supports 4–30 second clips up to 4K.
Video requests produce one clip and support text or starting/ending frames where
available. Kling 1.6 Pro, 2.1 Pro, and 3 currently require a starting frame.
Kling 2.6 ending-frame generation requires sound to be disabled.
Veo outputs above 720p require an eight-second duration.
WaveSpeed **Seedance 2.0** additionally supports Omni Reference, Edit video, and
Extend video. Choose Omni Reference, then select the WaveSpeed mode. Reference
mode accepts up to nine images, three videos, and three audio clips. Edit and
extend require exactly one input video; extend does not accept image/audio
references. Video and audio references are limited to 15 seconds combined per
kind, checked against cloud media metadata before submission. Edit may also use
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
uploading. Restarted jobs skip confirmed uploads and reuse keys after lost responses;
this relies on the ArtCraft server honoring those keys. Captured completion URLs
can be resumed without polling WaveSpeed again or retaining its API key.
Completed output bytes are cached atomically before upload and retained until the
task database confirms completion. Upload retries and automatic downloads reuse
these bytes even when the provider URL has expired. Transfers stream with HTTP
error checking, a 1 GiB limit, and finite timeouts. Local-library images additionally
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

On startup and every ten minutes, the polling thread removes caches for confirmed
terminal/cancelled tasks and provider partial downloads older than 24 hours. It
preserves pending outputs, uncertain submission receipts, and unrelated files.

## Validation before release

Automated tests use temporary storage and loopback HTTP fixtures, not paid
generation. Manually verify signed-out image/video generation, restart during a
download, Save As collisions, local deletion, account switching, cloud import,
and each Seedance mode on supported desktop platforms before release. Provider
generation tests spend credits and require explicit approval.

Real ArtCraft server deduplication remains unverified. An opt-in ignored test,
`live_artcraft_image_upload_idempotency_contract`, uploads a tiny PNG twice with
one key and checks that both responses return the same media token. Run only with
approval and a dedicated test account using `ARTCRAFT_LIVE_UPLOAD_TEST=1` and
`ARTCRAFT_TEST_SESSION` in the environment. It creates cloud media and does not
prove the video/legacy endpoints honor the same contract.

API references: [Nano Banana Pro](https://wavespeed.ai/docs/docs-api/google/google-nano-banana-pro-text-to-image),
[Seedream 4.5](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedream-v4.5),
[GPT Image 2.5](https://wavespeed.ai/docs/docs-api/openai/openai-gpt-image-2.5-flare-text-to-image),
[MiniMax H3](https://wavespeed.ai/docs/docs-api/minimax/minimax-h3-text-to-video),
[Seedance 2.5](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.5-text-to-video),
[Seedance 2.0 references](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.0-reference-to-video),
[Seedance 2.0 edit](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.0-video-edit),
[Seedance 2.0 extend](https://wavespeed.ai/docs/docs-api/bytedance/bytedance-seedance-2.0-video-extend),
and [Veo 3.1](https://wavespeed.ai/docs/docs-api/google/google-veo3.1-text-to-video).
