#!/bin/bash

set -euxo pipefail

echo 'Running tests...'

# TODO: Fix 'fakeyou_client' and 'billing_component'
# TODO: Run 'sqlite_queries' and 'aichatbot-sidecar' after postgres migrations

cargo test \
  --workspace \
  --exclude aichatbot-sidecar \
  --exclude billing_component \
  --exclude fakeyou_client \
  --exclude inference-job \
  --exclude mysql_queries \
  --exclude sqlite_queries

# Single broken tests
cargo test \
  --package inference-job \
  -- \
  --skip util::audiowmark::tests::test_audiowmark \
  --skip util::common_commands::audiowmark::tests::test_audiowmark

cargo test \
  --package mysql_queries \
  -- \
  --skip queries::model_weights::tests

echo 'Tests passed.'
