# ArtCraft for Android

The egui app in `../` (`artcraft-native`) running as `libartcraft_native.so`, hosted by a
GameActivity (`MainActivity.kt`). Rust ↔ Kotlin goes over JNI (`../src/platform/android.rs`).

Build a sideloadable APK (needs Rust, `cargo-ndk`, Android SDK 35 + NDK r26+, JDK 17, Gradle 8.9+,
cmake, nasm, libclang):

    export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/27.2.12479018
    script/android/build_apk.sh        # -> dist/ArtCraft.apk

Or run the "Android APK" GitHub Actions workflow and download the artifact.

Status: written but not yet built on a device. Known gaps: Midjourney sign-in (desktop webview),
settings don't persist across restarts, portrait-phone layouts are only partly adapted, soft
keyboard composition (Gboard) is untested.
