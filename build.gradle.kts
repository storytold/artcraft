plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

android {
  namespace = "ai.artcraft.mobile"
  compileSdk = 35

  defaultConfig {
    applicationId = "ai.artcraft.mobile"
    minSdk = 29 // MediaStore.RELATIVE_PATH (saving into the gallery) needs Android 10.
    targetSdk = 34 // 35+ forces edge-to-edge; this app doesn't handle system bar insets yet.
    versionCode = 1
    versionName = "0.1.0"
    // The ABIs `cargo ndk` built into src/main/jniLibs (see script/android/build_apk.sh).
    ndk { abiFilters += listOf("arm64-v8a") }
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      // Debug-signed so the release APK can be sideloaded; sign with your own key to publish.
      signingConfig = signingConfigs.getByName("debug")
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions { jvmTarget = "17" }

  sourceSets["main"].jniLibs.srcDirs("src/main/jniLibs")
}

dependencies {
  implementation("androidx.appcompat:appcompat:1.7.0")
  implementation("androidx.core:core-ktx:1.15.0")
  // The version android-activity 0.6 is written against. Don't enable prefab: android-activity
  // ships its own native glue and the upstream C++ layer would clash with it.
  implementation("androidx.games:games-activity:4.4.0")
}
