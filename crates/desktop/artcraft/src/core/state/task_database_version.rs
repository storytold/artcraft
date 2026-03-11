

/// Used to bump the task database schema version.
/// Migrations on customers' machines tend to fail on existing databases,
/// even if we instruct that the database file be deleted first.
/// It's easiest to just write to a new file and migrate from scratch.
/// We increment this whenever we make a change to the database schema.
/// This prevents deadlock on startup if the schema has changed from the
/// previous version.
pub const TASK_DATABASE_VERSION: u32 = 6;
