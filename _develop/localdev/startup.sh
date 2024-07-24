#!/bin/bash
set +e +o pipefail
diesel migration run --database-url="${MYSQL_URL}"
set -e -o pipefail
echo 'hello world in startup.sh'
#sleep infinity
date > /restart.txt
echo /restart.txt | entr -nrz /storyteller-rust/target/x86_64-unknown-linux-musl/release/storyteller-web
#/storyteller-rust/target/x86_64-unknown-linux-musl/release/storyteller-web