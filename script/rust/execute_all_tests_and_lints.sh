#!/bin/bash

set -euxo pipefail

echo 'Run cargo check...'

#RUSTFLAGS=-Awarnings cargo check
cargo check

echo 'Run lints...'
./execute_lints.sh

echo 'Run tests...'
./execute_tests.sh

echo 'All tests and lints passed successfully!'

