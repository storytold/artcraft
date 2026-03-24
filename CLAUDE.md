# CLAUDE.md

This file provides guidance for Claude Code when working with the Artcraft monorepo.

## Project Overview

Artcraft is a web and desktop application for generating AI image and video. It is written in 
Rust and TypeScript and contains desktop, server, and frontend components.

## Project Structure

```
artcraft/
├── _database/                           # Schema definitions and migrations (MySQL, SQLite, Elasticsearch, etc.)
│   ├── elasticsearch/                   # Elasticsearch schema and queries
│   └── sql/                             # MySQL and SQLite schema definitions and migrations
│       ├── artcraft_migrations/         # ArtCraft desktop app SQLite migrations
│       ├── migrations/                  # Server MySQL migrations
│       └── migrations_squashed/         # Fully materialized MySQL schema definitions for most tables
├── build/                               # Dockerfile build instructions for server components
├── crates/                              # Rust workspace
│   ├── api_clients/                     # HTTP clients for calling internal and 3rd party services
│   ├── cli/                             # Command line tools
│   ├── desktop/                         # Desktop (Tauri) apps
│   │   └── artcraft/                    # (Important) ArtCraft, the desktop app. This is one of our main pieces of software
│   ├── lib/                             # Various utility libraries for servers, CLI tools, desktop, etc.
│   ├── schema/                          # Data definition layer: MySQL, SQlite, Redis, S3/R2 buckets, etc.
│   │   ├── buckets/                     # Declares R2 cloud bucket topology
│   │   ├── database/                    # MySQL, SQLite, Elasticsearch, Redis, etc.
│   │   │   ├── elasticsearch_schema/    # Elasticsearch
│   │   │   ├── migration/               # (deprecated) Online schema adapters for MySQL 
│   │   │   ├── mysql_queries/           # Sqlx MySQL queries for our backend monolith `storyteller-web`, jobs, etc.
│   │   │   ├── redis_common/            # Redis support
│   │   │   ├── redis_schema/            # Redis key and HKEY topology
│   │   │   ├── sqlite_queries/          # (deprecated) Sqlite queries
│   │   │   └── sqlite_tasks/            # Queries for the ArtCraft desktop app's "tasks" database.
│   │   ├── public/                      # Token identifier and enum variant definitions
│   │   │   ├── composite_identifier/    # MySQL composite key system
│   │   │   ├── enums/                   # MySQL "enums" stored in VARCHAR fields.
│   │   │   └── tokens/                  # Primary database identifiers with Stripe-like ID prefixes, eg. "user_{entropy}"
│   │   └── service/                     # Backend HTTP services and jobs
│   │       ├── job/                     # Backend jobs.
│   │       │   └── video_thumbnail_job/ # Render video thumbnails
│   │       ├── plugins/                 # Collections of reusable Actix-Web HTTP functions (user and billing systems)
│   │       └── web/                     # HTTP web servers
│   │           └── storyteller_web/     # (Important) Our main HTTP API monolith and backend.
│   └── frontend/                        # Nx typescript monorepo for our websites and Tauri desktop apps
│       ├── apps/                        # Websites and Tauri desktop apps
│       │   ├── artcraft/                # ArtCraft the Tauri app's frontend. Used in conjunction with `artcraft` the Rust crate.
│       │   └── artcraft-website/        # The website for https://getartcraft.com
│       └── libs/                        # Support libraries, reusable React components, etc.
└── Cargo.toml                           # Rust monorepo workspace
```

## Code Style

- Rust with no minimum supported version
- Actix-web for HTTP services
- SQLx for MySQL and SQLite
- A mix of wreq and reqwest for Rust HTTP clients
- TypeScript with Nx, React, Vite, Zustand, and Three.js
- Use two spaces for indentation
