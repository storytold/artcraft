# mysql_queries

SQLx-based MySQL queries for the storyteller-web backend and background jobs.

## Building

```
SQLX_OFFLINE=true cargo check -p mysql_queries
```

The `SQLX_OFFLINE=true` env var is **required** for compilation. This crate uses the sqlx
offline cache (`.sqlx/` directory at the workspace root) to validate queries at compile time
without a live database connection.

## Query Style

### Prefer `sqlx::query!` and `sqlx::query_as!` macros

Always use the compile-time checked `sqlx::query!` and `sqlx::query_as!` macros over the
runtime `sqlx::query()` and `sqlx::query_as()` functions. The macros validate SQL syntax,
column names, and parameter types against the offline cache at compile time.

```rust
// PREFERRED: compile-time checked
sqlx::query!(
  r#"INSERT INTO my_table SET token = ?, name = ?"#,
  token,
  name,
)
  .execute(args.mysql_executor)
  .await?;

// AVOID: runtime only, no compile-time checking
sqlx::query(r#"INSERT INTO my_table SET token = ?, name = ?"#)
  .bind(token)
  .bind(name)
  .execute(args.mysql_executor)
  .await?;
```

Use runtime `sqlx::query()` only when:
- The query involves a table not yet in the offline cache and you cannot run `cargo sqlx prepare`
- The query is dynamically constructed (rare)
- SELECT queries for new tables where column type metadata isn't cached yet

### Offline Cache

When adding new queries for **existing tables**, the `.sqlx/` cache should already have the
schema metadata. For **new tables**, you may need to:

1. Run the migration against a real database
2. Run `cargo sqlx prepare` to regenerate the cache
3. Or manually create cache entries for simple INSERT/UPDATE queries (they only need parameter count)

### Error Types

New queries should return `Result<T, sqlx::Error>` instead of the legacy `AnyhowResult<T>`.
The `AnyhowResult` pattern is being phased out.

### Transaction Support

Use the executor-generic `Args` pattern for queries that need to work inside transactions:

```rust
pub struct MyQueryArgs<'a, 'c: 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  pub field: &'a str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}
```

This allows the same query function to accept both `&MySqlPool` and `&mut Transaction`.
