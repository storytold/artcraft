Migrations guide
================

## Diesel Migrations

To run pending migrations, execute the following:

```bash
diesel migration run
```

To revert the last 3 migrations:

```bash
diesel migration revert -n 3
```

To reset the entire database (drop, migrate), run:

```bash
diesel database reset
```

## Server Query Codegen

We use SQLx instead of Diesel in the production server. It's typesafe
SQL instead of an ORM like Diesel.

SQLx connects to a database to derive type information, but obviously
cannot do this for builds in CI. In order to cache the types, we build
and check in a cache file (necessary for builds):

```bash
SQLX_OFFLINE=true cargo sqlx prepare
```

Now that we have multiple binaries, it's required to include all the queries in the main
binary so we can generate the cached queries as a single target. That's then executed
with:

```bash
SQLX_OFFLINE=true cargo sqlx prepare -- --bin storyteller-web
```
