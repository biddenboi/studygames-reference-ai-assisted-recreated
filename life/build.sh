#!/bin/sh
# builds the Rust code and pastes the .wasm (as base64) into src/games/life.html
# so the game stays one file. needs: rustup target add wasm32-unknown-unknown
set -e
cd "$(dirname "$0")"
cargo build --release --target wasm32-unknown-unknown
node embed.js target/wasm32-unknown-unknown/release/life.wasm ../src/games/life.html
