# Pager Crate

Alerting/paging system that sends notifications via Rootly.

## Key Types

- `Pager` - Main client, cloneable. Has `enqueue_page()` and `shutdown_worker()`
- `PagerBuilder` - Constructs a Pager with optional background worker
- `NotificationDetails` - Alert payload with title, description, urgency, HTTP context, entity tokens
- `NotificationDetailsBuilder` - Fluent builder for constructing notifications
- `NotificationUrgency` - High, Medium, Low

## Building Notifications

```rust
let notification = NotificationDetailsBuilder::from_title("Something happened".to_string())
    .set_description(Some("Details...".to_string()))
    .set_urgency(Some(NotificationUrgency::High))
    .set_http_method(Some("POST".to_string()))
    .set_http_path(Some("/v1/endpoint".to_string()))
    .set_inference_job_token(Some(job_token.to_string()))
    .build();
```

For errors, use `from_error()` which auto-populates title and description from the error:

```rust
NotificationDetailsBuilder::from_error(&err)
    .set_title("Custom title".to_string())
    .set_urgency(Some(NotificationUrgency::Medium))
    .build()
```

## Deduplication

`NotificationDetails::to_deduplication_key()` generates a SHA-256 hash for dedup. Same title + HTTP context + hour = same key.

## Worker Thread

The pager worker uses `Condvar::wait()` (blocking). It MUST run on a dedicated OS thread, not a tokio task.
