# beeble_client

HTTP client for the Beeble SwitchX compositing API.

## API Reference

- Docs: https://developer.beeble.ai/docs
- OpenAPI: https://api.beeble.ai/developer-api-docs/openapi.json
- Auth: `x-api-key` header

## Endpoints

- `create_upload_url` — POST /v1/uploads — get a presigned PUT URL for uploading media
- `start_generation` — POST /v1/switchx/generations — start an image or video compositing job
- `get_job_status` — GET /v1/switchx/generations/{job_id} — poll job status until completed/failed

## Testing

```bash
cargo test -p beeble_client          # run non-ignored tests (API shape only)
cargo test -p beeble_client -- --ignored  # run live API tests (requires key, incurs costs)
```

Live tests require: `/Users/bt/Artcraft/credentials/beeble_api_key.txt`
