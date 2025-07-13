-- noinspection SqlDialectInspectionForFile

CREATE TABLE tasks (
    id TEXT NOT NULL PRIMARY KEY,

    task_status TEXT NOT NULL,
    task_type TEXT NOT NULL,

    provider TEXT,
    provider_job_id TEXT,

    frontend_subscriber_id TEXT,
    frontend_subscriber_payload TEXT,

    created_at INTEGER NOT NULL DEFAULT (unixepoch('now')),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch('now')),
    completed_at INTEGER DEFAULT NULL
);

-- Unique Indices
CREATE UNIQUE INDEX idx_tasks_on_provider_job_id ON tasks(provider_job_id);

-- Indices
CREATE INDEX idx_tasks_on_status ON tasks(task_status);
CREATE INDEX idx_tasks_on_provider ON tasks(provider);
