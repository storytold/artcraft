#!/usr/bin/env bash
# Builds the ArtCraft Android APK: the Rust app (artcraft-native) as libartcraft_native.so via
# cargo-ndk, then the Gradle project in artcraft-native/android that wraps it.
#
# You need:
#   - Rust (rustup) and `cargo install cargo-ndk`
#   - the Android SDK (ANDROID_HOME) with platform 35 and an NDK (ANDROID_NDK_HOME), r26 or newer
#   - JDK 17 and Gradle 8.9+ (or run `gradle wrapper` once in artcraft-native/android)
#   - cmake, nasm, clang/libclang (BoringSSL, which wreq uses, is built from source)
#
# Usage: script/android/build_apk.sh            # debug-signed release build -> dist/ArtCraft.apk
#        PROFILE=debug script/android/build_apk.sh
#        ABIS="arm64-v8a x86_64" script/android/build_apk.sh   # x86_64 is for emulators
set -euo pipefail

cd "$(dirname "$0")/../.."
ROOT="$PWD"
PROFILE="${PROFILE:-release}"
ABIS="${ABIS:-arm64-v8a}"
ANDROID_PROJECT="$ROOT/artcraft-native/android"
JNI_LIBS="$ANDROID_PROJECT/app/src/main/jniLibs"

: "${ANDROID_NDK_HOME:?set ANDROID_NDK_HOME to your NDK (e.g. \$ANDROID_HOME/ndk/27.2.12479018)}"
export ANDROID_NDK_HOME

target_for() {
  case "$1" in
    arm64-v8a) echo aarch64-linux-android ;;
    armeabi-v7a) echo armv7-linux-androideabi ;;
    x86_64) echo x86_64-linux-android ;;
    x86) echo i686-linux-android ;;
    *) echo "unknown ABI: $1" >&2; exit 1 ;;
  esac
}

ndk_args=()
for abi in $ABIS; do
  rustup target add "$(target_for "$abi")"
  ndk_args+=(-t "$abi")
done

cargo_profile=()
gradle_task="assembleDebug"
apk_dir="debug"
if [ "$PROFILE" = "release" ]; then
  cargo_profile=(--release)
  gradle_task="assembleRelease"
  apk_dir="release"
fi

rm -rf "$JNI_LIBS"
# --lib: Android only loads the cdylib (android_main); the desktop binary is skipped.
cargo ndk "${ndk_args[@]}" --platform 29 -o "$JNI_LIBS" build -p artcraft_native --lib "${cargo_profile[@]}"

# NDK sysroot folder name per ABI (it differs from the Rust target for 32-bit ARM).
triple_for() {
  case "$1" in
    arm64-v8a) echo aarch64-linux-android ;;
    armeabi-v7a) echo arm-linux-androideabi ;;
    x86_64) echo x86_64-linux-android ;;
    x86) echo i686-linux-android ;;
  esac
}

# If the library links the shared C++ runtime (oboe, the audio backend, may), it has to ship in the APK.
for abi in $ABIS; do
  so="$JNI_LIBS/$abi/libartcraft_native.so"
  if readelf -d "$so" 2>/dev/null | grep -q 'libc++_shared.so'; then
    stl="$(find "$ANDROID_NDK_HOME/toolchains/llvm/prebuilt" -path "*/sysroot/usr/lib/$(triple_for "$abi")/libc++_shared.so" | head -n1)"
    [ -n "$stl" ] || { echo "libc++_shared.so is needed but wasn't found in the NDK" >&2; exit 1; }
    cp "$stl" "$JNI_LIBS/$abi/"
    echo "Bundled libc++_shared.so for $abi"
  fi
done

if [ -x "$ANDROID_PROJECT/gradlew" ]; then
  (cd "$ANDROID_PROJECT" && ./gradlew --no-daemon "$gradle_task")
else
  gradle -p "$ANDROID_PROJECT" --no-daemon "$gradle_task"
fi

mkdir -p "$ROOT/dist"
apk="$(find "$ANDROID_PROJECT/app/build/outputs/apk/$apk_dir" -name '*.apk' | head -n1)"
cp "$apk" "$ROOT/dist/ArtCraft.apk"
echo "Built $ROOT/dist/ArtCraft.apk"
