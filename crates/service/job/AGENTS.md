# Background Jobs

Background job crates that run as standalone processes alongside storyteller-web.

## Common Pattern

All jobs follow the same structure:

1. `main.rs` - Bootstrap, DB pool, bucket client, pager setup, thread spawning
2. `job_dependencies.rs` - Shared state struct passed to the main loop
3. `startup/build_pager.rs` - Pager initialization from env vars
4. `http_server/` - Health check endpoint for k8s liveness probes
5. `job/` or `jobs/` - Main processing logic

## Threading Model

- **Main thread** (`#[tokio::main]`): runs the job's main loop
- **HTTP server thread** (`std::thread::spawn`): dedicated OS thread with its own `actix_web::rt::System`
- **Pager worker thread** (`std::thread::spawn`): dedicated OS thread (uses blocking `Condvar::wait`)
- **Signal handler** (`tokio::spawn`): listens for SIGTERM/SIGINT to set `application_shutdown` flag

Important: Do NOT use `#[actix_web::main]` - it registers signal handlers that steal SIGINT. Use `#[tokio::main]` instead.

Important: Do NOT spawn the pager worker via `tokio::spawn` - its `Condvar::wait` blocks the runtime. Use a dedicated OS thread.

## Pager Integration

Use the `alert_pager_and_return_err()` helper pattern for error reporting:

```rust
if let Err(err) = some_operation().await {
  error!("Descriptive message: {:?}", err);
  return alert_pager_and_return_err(&deps.pager, "Alert title", err, optional_job_ref);
}
```

## Environment Variables

Shared across jobs (via `shared_env_var_config`):
- `ENABLE_PAGING` - Master switch for pager alerts
- `ROOTLY_API_KEY` - Rootly API key for sending alerts
- `ROOTLY_NOTIFICATION_TARGET_TYPE` / `ROOTLY_NOTIFICATION_TARGET_ID`
