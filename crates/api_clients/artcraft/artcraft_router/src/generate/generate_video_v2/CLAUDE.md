# generate_video_v2

This module implements the v2 video generation pipeline. It replaces the v1 system
(in `generate_video/`) with a two-phase approach that separates request planning from
execution, allowing cost estimation and media uploads to happen at the right time.

## Lifecycle

```
GenerateVideoRequestBuilder
    │
    ▼ build2()
VideoGenerationDraftOrRequest
    │
    ├─ Draft(VideoGenerationDraftRequest)
    │       │
    │       ▼ estimate_cost()   ← cost estimate from draft state
    │       │
    │       ▼ finalize(context) ← uploads media, resolves tokens
    │       │
    │       ▼
    │   VideoGenerationRequest
    │       │
    │       ▼ estimate_cost()   ← cost estimate from finalized request
    │       │
    │       ▼ send_request()    ← fires the API call
    │       │
    │       ▼
    │   GenerateVideoResponse
    │
    └─ Request(VideoGenerationRequest)  ← skips draft phase (used by Artcraft provider)
```

### Key types

- **`GenerateVideoRequestBuilder`** — generic builder with provider/model/prompt/resolution/etc.
  Located in `generate_video/generate_video_request_builder.rs`. The `use_new_builder()` method
  gates which provider+model combos use the v2 path. `build2()` dispatches to the correct
  provider's build function.

- **`VideoGenerationDraftOrRequest`** — the output of `build2()`. Either `Draft` (for providers
  that need media upload/resolution, like Kinovi) or `Request` (for providers that work with
  media file tokens directly, like Artcraft).

- **`VideoGenerationDraftRequest`** — enum with one variant per provider+model. Holds
  materialized settings (resolution, duration, batch count) plus unresolved media references.
  Can estimate cost without network calls.

- **`VideoGenerationDraftContext`** — context needed during `finalize()`: the provider client,
  media file token-to-URL map, and character token-to-ID map.

- **`VideoGenerationRequest`** — enum with one variant per provider+model. Holds a fully
  materialized request ready to send. All media URLs are resolved and uploaded.

### Cost estimation

Cost can be estimated at two stages:
1. **From draft** — before `finalize()`. Uses the planned resolution/duration/batch count.
   Good for showing the user a price before committing.
2. **From request** — after `finalize()`. Uses the final materialized request. Should match
   the draft estimate for the same parameters.

## Module layout

```
generate_video_v2/
├── mod.rs
├── video_generation_draft.rs           ← VideoGenerationDraftRequest enum
├── video_generation_draft_context.rs   ← context for finalize()
├── video_generation_draft_or_request.rs
├── video_generation_request.rs         ← VideoGenerationRequest enum
└── providers/
    ├── artcraft/                       ← Artcraft provider (uses media file tokens directly)
    │   ├── seedance_2p0/              ← Seedance 2.0 Pro model (skips draft, returns Request directly)
    │   │   ├── mod.rs
    │   │   ├── build.rs               ← builder → Request conversion + plan helpers
    │   │   ├── cost.rs                ← standalone cost estimation (independent of seedance2pro_client)
    │   │   └── request.rs             ← request state + send() via Artcraft multi-function API
    │   └── seedance_2p0_fast/         ← Seedance 2.0 Fast model (skips draft, 480p/720p only)
    │       ├── mod.rs
    │       ├── build.rs               ← builder → Request conversion + plan helpers (no 1080p)
    │       ├── cost.rs                ← standalone cost estimation with Fast-specific pricing
    │       └── request.rs             ← request state + send() via Artcraft omni-gen API
    └── kinovi/                         ← Kinovi/Seedance2Pro provider
        ├── mod.rs
        ├── resolve.rs                  ← shared: media token resolution, upload helpers
        ├── upload.rs                   ← shared: download + re-upload to Seedance2Pro CDN
        ├── seedance_2p0/              ← Seedance 2.0 Pro model
        │   ├── mod.rs
        │   ├── build.rs               ← builder → draft conversion + plan helpers
        │   ├── cost.rs                ← cost estimation state
        │   ├── draft.rs               ← draft state + finalize (to_request)
        │   └── request.rs             ← request state + send()
        └── seedance_2p0_fast/         ← Seedance 2.0 Fast model
            ├── mod.rs
            ├── build.rs
            ├── cost.rs
            ├── draft.rs
            └── request.rs
```

## Adding a new provider or model

1. **Create the module** under `providers/{provider}/{model}/` with these files:
   - `mod.rs` — declares sub-modules
   - `build.rs` — `build_{provider}_{model}(builder) -> VideoGenerationDraftOrRequest`.
     Contains `plan_*` helpers for aspect ratio, resolution, batch count, duration.
   - `draft.rs` — draft state struct with `to_request()` async method for finalization.
     **Not needed** if the provider uses media tokens directly (no upload/resolution needed);
     in that case `build.rs` returns `VideoGenerationDraftOrRequest::Request(...)` directly.
   - `cost.rs` — cost state with `from_request()` and `estimate_cost()`. Add `from_draft()`
     if the provider uses the draft phase.
   - `request.rs` — request state with `send()` async method.

2. **Register the module** in the parent provider's `mod.rs`.

3. **Add enum variants** in:
   - `video_generation_draft.rs` — `VideoGenerationDraftRequest` enum + `estimate_cost` + `finalize`
     (skip if provider has no draft phase)
   - `video_generation_request.rs` — `VideoGenerationRequest` enum + `estimate_cost` + `send_request`

4. **Wire into the builder** in `generate_video_request_builder.rs`:
   - Add the `(Provider, Model)` pair to `use_new_builder()` returning `true`
   - Add the dispatch arm in `build2()`

5. **Tests**: each `build.rs` and `cost.rs` should have comprehensive tests. `request.rs`
   should have `#[ignore]` live API tests for manual verification.
