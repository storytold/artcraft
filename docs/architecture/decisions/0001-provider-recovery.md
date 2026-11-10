# Provider-local persistence and recovery

## Context

WaveSpeed creation spends the user's provider credits. Desktop processes can
stop after a paid request is accepted but before its task or upload is saved.
Signed-out users also need a library without an ArtCraft cloud identity.

## Decision

- Keep signed-out outputs and their metadata in the app-owned local library.
  Signing in later does not silently upload an explicitly local generation.
- Persist submission receipts before creation and never automatically repeat a
  creation POST with uncertain acceptance. Recover its ID from provider History.
- Persist output bytes and upload progress before cloud transfer. Stable upload
  keys are reused only for the same task, provider, API host, and verified account.
  Confirmed cloud uploads are not repeated. Server-side deduplication remains an
  external contract, not something a local receipt can guarantee.
- Enforce WaveSpeed prediction uniqueness in SQLite and preserve terminal
  statuses/results while allowing users to dismiss completed tasks.
- Quarantine corrupt submission receipts and fail unreadable upload checkpoints
  rather than discard potentially paid progress and upload again.

## Consequences

Local data survives restart and uses disk space until deleted. Uncertain paid
submissions require explicit user recovery. Account switches pause in-progress
cloud transfers until the original account signs in again. Output transfers have
finite size and network restrictions; redirecting media URLs are rejected.
Credentials require an available OS keychain/Secret Service; there is no plaintext
fallback. Existing WaveSpeed plaintext keys are removed only after secure storage
succeeds.

## Alternatives considered

- Automatically retrying creation: rejected because provider idempotency is not
  assumed and duplicate submissions can incur charges.
- Uploading all signed-out outputs after login: rejected because login is not
  consent to publish local media to the cloud library.
- Discarding partial progress after any error: rejected because it loses recovery
  identities and may duplicate cloud uploads.
