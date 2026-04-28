# Testing

## Running Tests

- Most crates: `cargo test -p {crate_name}`
- Crates using SQLx offline mode: `SQLX_OFFLINE=true cargo test -p {crate_name}`
- The `storyteller-web` and `mysql_queries` crates require `SQLX_OFFLINE=true` for compilation
- Use `cargo check -p {crate_name}` for fast compilation checks without running tests

## Test Patterns

- Tests live in `#[cfg(test)] mod tests { ... }` at the bottom of each file
- Group related tests into sub-modules by category (e.g. `mod pricing_tests`, `mod resolution_tests`)
- Only create a sub-module when it has 2+ tests — don't wrap a single test in its own module
- Keep nesting shallow: `mod tests { mod category { ... } }` is fine; a third level is rarely needed
- Shared helpers used by multiple sub-modules belong in the parent `mod tests`, not duplicated in each sub-module
- Enum tests should cover: serialization, deserialization, `to_str`/`from_str` round-trip, variant count
- Password/crypto tests: be mindful of computation cost, don't add too many bcrypt test cases

## Test File Layout

Put test cases first, helpers last. Engineers should see the actual tests before scrolling
to understand helper plumbing.

Within a `mod tests { ... }` block:

1. **Imports** at the top
2. **Constants** (test data IDs, URLs, etc.) — small context that tests reference
3. **Test functions** (`#[test]` / `#[tokio::test]`) grouped by category
4. **Helper functions** (builders, pipeline runners, etc.) at the very bottom

If tests are grouped into sub-modules, the same rule applies within each sub-module:
constants first, then tests, then helpers at the end of that sub-module.

## What to Test

- New error types and their mappings
- Enum variant serialization stability (these are stored in the database)
- Hash/deduplication functions with known inputs
- Edge cases in parsers (empty input, missing fields, malformed data)

## Imports in Tests

- Import test fixtures and constants with `use`, not inline fully-qualified paths.
  Write `use test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL;` at the top,
  then reference `JUNO_AT_LAKE_IMAGE_URL` in test bodies.
- Same rule applies to enum variants used in match arms — import them, don't write
  `crate::some::deep::module::MyEnum::Variant` inline.

## What Not to Test

- Don't add integration tests that require a running database unless explicitly asked
- Don't add tests for simple struct construction or trivial getters
