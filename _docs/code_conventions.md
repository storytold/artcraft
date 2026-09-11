Code Conventions
================

We use three languages at Artcraft: Rust, TypeScript, and Python.

## Rust style guide

We deviate from the official Rust style guide in a few places:

- We use two spaces for indentation instead of four.
- We typically keep one function or type definition per file, though this isn't a steadfast rule.
- We use a Cargo workspace to share code within our monorepo.

### Rust Preferred Libraries

We use the following Rust libraries, though we are open to migrating to alternatives:

- `actix-web` for our HTTP web server
- `reqwest` for HTTP client requests
- `sqlx` for SQL database operations
- `tokio` for asynchronous programming

## TypeScript style guide

- We use two spaces for indentation instead of four.
- We use `nx` for monorepo management
