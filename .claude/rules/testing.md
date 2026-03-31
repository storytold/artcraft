# Testing

## Running Tests

- Most crates: `cargo test -p {crate_name}`
- Crates using SQLx offline mode: `SQLX_OFFLINE=true cargo test -p {crate_name}`
- The `storyteller-web` and `mysql_queries` crates require `SQLX_OFFLINE=true` for compilation
- Use `cargo check -p {crate_name}` for fast compilation checks without running tests

## Test Patterns

- Tests live in `#[cfg(test)] mod tests { ... }` at the bottom of each file
- Group related tests in sub-modules: `mod explicit_checks`, `mod mechanical_checks`
- Enum tests should cover: serialization, deserialization, `to_str`/`from_str` round-trip, variant count
- Password/crypto tests: be mindful of computation cost, don't add too many bcrypt test cases

## What to Test

- New error types and their mappings
- Enum variant serialization stability (these are stored in the database)
- Hash/deduplication functions with known inputs
- Edge cases in parsers (empty input, missing fields, malformed data)

## What Not to Test

- Don't add integration tests that require a running database unless explicitly asked
- Don't add tests for simple struct construction or trivial getters
