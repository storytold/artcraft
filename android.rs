//! Android: the Rust side of the bridge to `MainActivity.kt` (package `ai.artcraft.mobile`).
//!
//! Rust runs on the native glue's own thread, never the Java UI thread. Calls into Java are plain
//! JNI method calls on the activity. The file picker is asynchronous on purpose: while Android's
//! document picker is on screen the activity's surface is destroyed, and the glue makes the UI
//! thread wait for this thread to acknowledge that, so blocking here for the picker would deadlock.
//! Instead Java calls `nativeOnPicked` when the user is done and the result goes to the mailbox.

use std::ffi::c_void;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;

use jni::objects::{GlobalRef, JObject, JObjectArray, JString, JValue};
use jni::sys::jint;
use jni::{JNIEnv, JavaVM};

use super::{FileFilter, PickKey};

struct Bridge {
  vm: JavaVM,
  activity: GlobalRef,
  data_dir: PathBuf,
}

static BRIDGE: OnceLock<Bridge> = OnceLock::new();

/// Called once from `android_main`.
///
/// # Safety
/// `vm` and `activity` must be the `JavaVM` and `Activity` pointers handed out by `AndroidApp`.
pub unsafe fn init(vm: *mut c_void, activity: *mut c_void, internal_data_path: Option<PathBuf>) {
  let Ok(vm) = JavaVM::from_raw(vm.cast()) else {
    log::error!("The JavaVM pointer was invalid; Android features are disabled");
    return;
  };
  let activity = {
    let Ok(env) = vm.attach_current_thread() else {
      log::error!("Couldn't attach the native thread to the JVM");
      return;
    };
    // The activity object is only borrowed from the glue, so keep our own global reference.
    match env.new_global_ref(JObject::from_raw(activity.cast())) {
      Ok(global) => global,
      Err(err) => {
        log::error!("Couldn't keep a reference to the activity: {err}");
        return;
      },
    }
  };
  let data_dir = internal_data_path.unwrap_or_else(|| PathBuf::from("/data/local/tmp")).join("Artcraft");
  let _ = BRIDGE.set(Bridge { vm, activity, data_dir });
}

/// Runs `f` with a JNI environment for this thread and the activity, turning any Java exception
/// into an error (and clearing it, so later calls still work).
fn with_activity<R>(f: impl FnOnce(&mut JNIEnv, &JObject) -> jni::errors::Result<R>) -> Result<R, String> {
  let bridge = BRIDGE.get().ok_or_else(|| "the Android bridge isn't initialised".to_owned())?;
  let mut env = bridge.vm.attach_current_thread().map_err(|e| e.to_string())?;
  let result = f(&mut env, bridge.activity.as_obj());
  if env.exception_check().unwrap_or(false) {
    let _ = env.exception_describe();
    let _ = env.exception_clear();
    return Err("a Java exception was thrown".to_owned());
  }
  result.map_err(|e| e.to_string())
}

/// The app's private files directory, plus `Artcraft`.
pub fn data_root() -> PathBuf {
  BRIDGE.get().map(|b| b.data_dir.clone()).unwrap_or_else(|| PathBuf::from("Artcraft"))
}

pub fn open_url(url: &str) -> Result<(), String> {
  let opened = with_activity(|env, activity| {
    let url = env.new_string(url)?;
    env.call_method(activity, "openUrl", "(Ljava/lang/String;)Z", &[JValue::Object(&url)])?.z()
  })?;
  if opened {
    Ok(())
  } else {
    Err("no app can open this link".to_owned())
  }
}

pub fn reveal_folder(_path: &Path) -> Result<(), String> {
  Err("Android doesn't let apps open their private folder".to_owned())
}

/// Downloads go to a folder inside the app's storage and are then published to the gallery.
pub fn save_target(file_name: &str) -> Option<PathBuf> {
  let dir = downloads_dir()?;
  Some(dir.join(file_name))
}

pub fn save_folder() -> Option<PathBuf> {
  downloads_dir()
}

fn downloads_dir() -> Option<PathBuf> {
  let dir = data_root().join("downloads");
  std::fs::create_dir_all(&dir).ok()?;
  Some(dir)
}

/// Copies the finished download into the device's Pictures, Movies, Music or Downloads folder
/// (Java does the copy on a background thread).
pub fn after_save(path: &Path) {
  let Some(path) = path.to_str() else {
    return;
  };
  if let Err(err) = with_activity(|env, activity| {
    let path = env.new_string(path)?;
    env.call_method(activity, "publishMedia", "(Ljava/lang/String;)V", &[JValue::Object(&path)])?.v()
  }) {
    log::warn!("Couldn't publish the download to the gallery: {err}");
  }
}

/// Opens Android's document picker for the MIME types of `filters`.
pub fn request_pick(key: PickKey, filters: &[FileFilter], multiple: bool) {
  let mime_types: Vec<&str> = filters.iter().flat_map(|f| f.mime_types.iter().copied()).collect();
  let started = with_activity(|env, activity| {
    let string_class = env.find_class("java/lang/String")?;
    let array = env.new_object_array(mime_types.len() as jint, &string_class, JObject::null())?;
    for (i, mime) in mime_types.iter().enumerate() {
      let mime = env.new_string(mime)?;
      env.set_object_array_element(&array, i as jint, mime)?;
    }
    env.call_method(activity, "requestPick", "(I[Ljava/lang/String;Z)V", &[JValue::Int(key as jint), JValue::Object(&array), JValue::Bool(multiple.into())])?.v()
  });
  if let Err(err) = started {
    log::error!("Couldn't open the file picker: {err}");
    super::post_picked(key as u32, Vec::new());
  }
}

/// `MainActivity.nativeOnPicked(key: Int, paths: Array<String>)`: the user finished (or cancelled)
/// choosing files. The paths are copies in the app's cache, named like the originals.
#[no_mangle]
pub extern "system" fn Java_ai_artcraft_mobile_MainActivity_nativeOnPicked(mut env: JNIEnv, _this: JObject, key: jint, paths: JObjectArray) {
  let mut picked = Vec::new();
  let count = env.get_array_length(&paths).unwrap_or(0);
  for i in 0..count {
    let Ok(element) = env.get_object_array_element(&paths, i) else {
      continue;
    };
    let element = JString::from(element);
    let text: Option<String> = env.get_string(&element).ok().map(String::from);
    if let Some(text) = text {
      picked.push(PathBuf::from(text));
    }
  }
  if PickKey::from_u32(key as u32).is_some() {
    super::post_picked(key as u32, picked);
  }
}
