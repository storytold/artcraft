//! Manual update checks and verified installation shared with the native Craft apps.
use craft_update::pins::{Choice, Pins};
use craft_update::self_update::Install;
use craft_update::{self_update, pick_asset, App, Http, Os, PackageKind, Paths, Platform, Release, Stop};
use enums::tauri::tasks::task_status::TaskStatus;
use serde_derive::Serialize;
use sqlite_tasks::queries::list_tasks_for_frontend::list_tasks_for_frontend;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use crate::core::state::task_database::TaskDatabase;
use crate::version::ARTCRAFT_VERSION;

const APP: App = App { bundle_id_override: Some("ai.artcraft.app"), ..App::new("artcraft", "ArtCraft", "Create images and video", "storytold/artcraft") };

#[derive(Default)]
pub struct Updates {
  busy: AtomicBool,
  installing: AtomicBool,
  maybe_release: Mutex<Option<Release>>,
  maybe_restart: Mutex<Option<Restart>>,
}

#[derive(Debug, Serialize)]
pub struct UpdateInfo {
  pub current_version: String,
  pub maybe_available_version: Option<String>,
  pub can_install: bool,
  pub tasks_running: bool,
  pub releases_url: String,
}

type Restart = Box<dyn FnOnce() -> Result<(), String> + Send>;

/// Only effects cross this boundary. Tests exercise the same state transitions without
/// networking, changing an installed copy, reading personal preferences, or exiting a process.
trait Backend {
  fn stable_choice(&self) -> Result<(), String>;
  fn check(&self) -> Result<Option<Release>, String>;
  fn idle(&self) -> Result<(), String>;
  fn installation(&self) -> Option<(Install, Platform)>;
  fn can_replace(&self) -> bool;
  fn prepare(&self, install: &Install, release: &Release, platform: Platform, before_replace: &dyn Fn() -> Result<(), String>) -> Result<Restart, String>;
  fn request_exit(&self);
}

struct NativeBackend<'a>(&'a AppHandle);
struct Installing<'a>(&'a AtomicBool);

pub(crate) struct Operation {
  updates: Arc<Updates>,
}

impl Updates {
  pub(crate) fn begin(self: &Arc<Self>) -> Result<Operation, String> {
    self.busy.compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire).map_err(|_| "An update operation is already running. Please wait.".to_owned())?;
    Ok(Operation { updates: Arc::clone(self) })
  }

  /// Runs `work` off the async runtime while it holds the one-operation guard.
  pub(crate) async fn run<T: Send + 'static>(self: &Arc<Self>, stopped: &str, work: impl FnOnce(&Updates) -> Result<T, String> + Send + 'static) -> Result<T, String> {
    let operation = self.begin()?;
    let state = Arc::clone(self);
    tauri::async_runtime::spawn_blocking(move || {
      let _operation = operation;
      work(&state)
    })
    .await
    .map_err(|error| format!("{stopped}: {error}"))?
  }

  pub(crate) fn check(&self, app: &AppHandle) -> Result<UpdateInfo, String> {
    self.check_with(&NativeBackend(app))
  }

  fn check_with(&self, backend: &impl Backend) -> Result<UpdateInfo, String> {
    backend.stable_choice()?;
    let maybe_release = backend.check()?;
    let tasks_running = backend.idle().is_err();
    let self_updating = maybe_release.as_ref().is_some_and(|release| backend.can_replace() && backend.installation().is_some_and(|(install, platform)| release_fits_copy(release, &install, platform)));
    let info = update_info(maybe_release.as_ref(), self_updating, tasks_running);
    *self.maybe_release.lock().map_err(|_| "The update state is unavailable. Restart ArtCraft and try again.")? = maybe_release;
    Ok(info)
  }

  pub(crate) fn install(&self, app: &AppHandle) -> Result<(), String> {
    self.install_with(&NativeBackend(app))
  }

  fn install_with(&self, backend: &impl Backend) -> Result<(), String> {
    self.installing.store(true, Ordering::Release);
    let _installing = Installing(&self.installing);
    backend.idle()?;
    backend.stable_choice()?;
    let release = self.maybe_release.lock().map_err(|_| "The update state is unavailable. Restart ArtCraft and try again.")?.clone().ok_or("Check for updates before installing one.")?;
    let (install, platform) = backend.installation().ok_or("This installation cannot update itself. Open Releases or use its package manager.")?;
    if !backend.can_replace() || !release_fits_copy(&release, &install, platform) {
      return Err("Use Releases or your package manager to update this installation.".into());
    }
    // Recheck tasks and launcher choices immediately before replacing any application files.
    let before_replace = || backend.idle().and_then(|()| backend.stable_choice());
    let restart = backend.prepare(&install, &release, platform, &before_replace)?;
    *self.maybe_restart.lock().map_err(|_| "The restart state is unavailable. Restart ArtCraft manually.")? = Some(restart);
    // The helper starts in RunEvent::Exit, after Tauri accepts the normal exit request.
    backend.request_exit();
    Ok(())
  }

  /// Keep the native process and window alive until replacement finishes. A prepared helper
  /// may request the normal exit itself, so its restart must not be cancelled here.
  pub fn prevents_exit(&self) -> bool {
    self.installing.load(Ordering::Acquire) && self.maybe_restart.lock().map_or(true, |pending| pending.is_none())
  }

  pub fn finish(&self) {
    match self.maybe_restart.lock() {
      Ok(mut pending) => {
        if let Some(restart) = pending.take() {
          if let Err(error) = restart() {
            log::error!("Could not start the update helper: {error}");
          }
        }
      },
      Err(_) => log::error!("Could not read the prepared update helper"),
    }
  }
}

impl Drop for Installing<'_> {
  fn drop(&mut self) {
    self.0.store(false, Ordering::Release);
  }
}

impl Drop for Operation {
  fn drop(&mut self) {
    self.updates.busy.store(false, Ordering::Release);
  }
}

pub fn finish_helper() -> Option<Result<(), String>> {
  self_update::finish(&APP, &std::env::args_os().skip(1).collect::<Vec<_>>())
}

pub fn show_previous_outcome(app: &AppHandle) {
  let Ok(paths) = Paths::for_app(&APP) else {
    return;
  };
  if let Some(message) = outcome_message(self_update::take_outcome(&paths, ARTCRAFT_VERSION)) {
    app.dialog().message(message).title("ArtCraft update").show(|_| {});
  }
}

fn outcome_message(outcome: Option<self_update::Outcome>) -> Option<String> {
  match outcome? {
    self_update::Outcome::Installed(version) => Some(format!("ArtCraft was updated to {version}.")),
    self_update::Outcome::Failed(error) => Some(format!("The ArtCraft update failed: {error}")),
  }
}

pub(crate) fn require_confirmation(confirmed: bool) -> Result<(), String> {
  if confirmed {
    Ok(())
  } else {
    Err("Confirm that you saved your work before installing the update.".into())
  }
}

fn stable_choice(pins: &Pins) -> Result<(), String> {
  match pins.choice(APP.id) {
    Choice::Stable => Ok(()),
    _ => Err("ArtCraft Launcher manages this app's version. Change its version there.".into()),
  }
}

fn ensure_idle(app: &AppHandle) -> Result<(), String> {
  let db = app.try_state::<TaskDatabase>().ok_or("ArtCraft is still starting. Try checking again in a moment.")?;
  let tasks = tauri::async_runtime::block_on(list_tasks_for_frontend(db.get_connection())).map_err(|error| format!("Could not check running tasks: {error}"))?;
  no_active_tasks(tasks.tasks.iter().map(|task| task.status))
}

fn no_active_tasks(statuses: impl IntoIterator<Item = TaskStatus>) -> Result<(), String> {
  if statuses.into_iter().any(active_task) {
    Err("Finish or cancel running tasks before installing an update.".into())
  } else {
    Ok(())
  }
}

fn active_task(status: TaskStatus) -> bool {
  matches!(status, TaskStatus::Pending | TaskStatus::Started | TaskStatus::AttemptFailed)
}

impl Backend for NativeBackend<'_> {
  fn stable_choice(&self) -> Result<(), String> {
    stable_choice(&Pins::load_default())
  }

  fn check(&self) -> Result<Option<Release>, String> {
    let http = Http::new(&format!("ArtCraft/{ARTCRAFT_VERSION}"))?;
    craft_update::check_for_update(&APP, &http, ARTCRAFT_VERSION)
  }

  fn idle(&self) -> Result<(), String> {
    ensure_idle(self.0)
  }

  fn installation(&self) -> Option<(Install, Platform)> {
    self_update::current(&APP).zip(Platform::current())
  }

  fn can_replace(&self) -> bool {
    self_update::is_self_updating(&APP)
  }

  fn prepare(&self, install: &Install, release: &Release, platform: Platform, before_replace: &dyn Fn() -> Result<(), String>) -> Result<Restart, String> {
    let http = Http::new(&format!("ArtCraft/{ARTCRAFT_VERSION}"))?;
    let paths = Paths::for_app(&APP)?;
    let restart = self_update::prepare_update(&APP, install, release, platform, &http, &paths, &Stop::default(), &mut |_| {}, before_replace, Some(ARTCRAFT_VERSION))?;
    Ok(Box::new(move || restart.start()))
  }

  fn request_exit(&self) {
    self.0.exit(0);
  }
}

fn release_fits_copy(release: &Release, install: &Install, platform: Platform) -> bool {
  let kind = match install {
    Install::MacApp(_) => PackageKind::Dmg,
    Install::Msi(_) => PackageKind::Msi,
    Install::Portable(_) => PackageKind::PortableZip,
    Install::AppImage(_) => PackageKind::AppImage,
    Install::Package(kind, _) => *kind,
    Install::Flatpak => PackageKind::Flatpak,
    // ArtCraft also ships NSIS. It must not be unpacked over as a loose portable copy;
    // its registered installer remains its update path until the shared helper supports it.
    Install::Standalone(_) if platform.os == Os::Windows => return false,
    Install::Standalone(_) => PackageKind::TarGz,
  };
  pick_asset(release, &[APP.id], platform, &[kind]).is_some()
}

fn update_info(maybe_release: Option<&Release>, self_updating: bool, tasks_running: bool) -> UpdateInfo {
  UpdateInfo { current_version: ARTCRAFT_VERSION.into(), maybe_available_version: maybe_release.map(Release::version_label), can_install: !tasks_running && self_updating && maybe_release.is_some(), tasks_running, releases_url: APP.releases_url() }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn package_identity_and_display_version_match_the_release_configuration() {
    let config: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json")).expect("release configuration");
    assert_eq!(config["version"].as_str(), Some(ARTCRAFT_VERSION));
    assert_eq!(config["identifier"].as_str(), Some(APP.bundle_id().as_str()));
    let mac: serde_json::Value = serde_json::from_str(include_str!("../tauri-mac.conf.json")).expect("macOS release configuration");
    assert_eq!(mac["version"].as_str(), Some(ARTCRAFT_VERSION), "the macOS build must report the same version");
  }

  #[test]
  fn tauri_installers_and_flatpaks_are_offered_only_for_the_matching_copy() {
    use craft_update::{Arch, Asset};
    let release = Release { assets: ["ArtCraft_0.42.1_x64_en-US.msi", "ArtCraft_0.42.1_universal.dmg", "artcraft-0.42.1-linux-x86_64.flatpak"].into_iter().map(|name| Asset { name: name.into(), ..Asset::default() }).collect(), ..Release::default() };
    assert!(release_fits_copy(&release, &Install::Msi("unused.exe".into()), Platform { os: Os::Windows, arch: Arch::X64 }));
    assert!(release_fits_copy(&release, &Install::MacApp("unused.app".into()), Platform { os: Os::MacOs, arch: Arch::Arm64 }));
    assert!(release_fits_copy(&release, &Install::Flatpak, Platform { os: Os::Linux, arch: Arch::X64 }));
    assert!(!release_fits_copy(&release, &Install::Flatpak, Platform { os: Os::Linux, arch: Arch::Arm64 }));
    assert!(!release_fits_copy(&release, &Install::Standalone("unused.exe".into()), Platform { os: Os::Windows, arch: Arch::X64 }));
  }

  #[test]
  fn checks_allow_closing_but_an_unfinished_install_keeps_the_window_alive() {
    let state = Arc::new(Updates::default());
    let _check = state.begin().expect("checking");
    assert!(!state.prevents_exit());
    state.installing.store(true, Ordering::Release);
    let installing = Installing(&state.installing);
    assert!(state.prevents_exit());
    drop(installing);
    assert!(!state.prevents_exit());
  }

  #[test]
  fn running_and_retrying_tasks_block_an_update_but_completed_tasks_do_not() {
    for status in [TaskStatus::Pending, TaskStatus::Started, TaskStatus::AttemptFailed] {
      assert!(active_task(status));
    }
    for status in [TaskStatus::CompleteSuccess, TaskStatus::CompleteFailure, TaskStatus::Dead, TaskStatus::CancelledByUser, TaskStatus::CancelledByProvider, TaskStatus::CancelledByUs] {
      assert!(!active_task(status));
    }
    assert!(no_active_tasks([TaskStatus::CompleteSuccess, TaskStatus::Dead]).is_ok());
    assert!(no_active_tasks([]).is_ok());
    assert_eq!(no_active_tasks([TaskStatus::CompleteSuccess, TaskStatus::Started]), Err("Finish or cancel running tasks before installing an update.".into()));
  }

  #[test]
  fn only_the_stable_track_lets_artcraft_update_itself() {
    use craft_update::pins::VersionTrack;
    let mut pins = Pins::default();
    assert!(stable_choice(&pins).is_ok());
    pins.set(APP.id, &VersionTrack::Pinned("0.41.0".into()));
    assert!(stable_choice(&pins).unwrap_err().contains("ArtCraft Launcher manages this app's version"));
    pins.set(APP.id, &VersionTrack::Nightly);
    assert!(stable_choice(&pins).is_err());
    pins.set(APP.id, &VersionTrack::Stable);
    assert!(stable_choice(&pins).is_ok());
  }

  #[test]
  fn a_previous_update_outcome_is_reported_once_with_its_version_or_error() {
    let installed = craft_update::parse_version("0.42.1").expect("version");
    assert_eq!(outcome_message(Some(self_update::Outcome::Installed(installed))).as_deref(), Some("ArtCraft was updated to 0.42.1."));
    assert_eq!(outcome_message(Some(self_update::Outcome::Failed("disk full".into()))).as_deref(), Some("The ArtCraft update failed: disk full"));
    assert_eq!(outcome_message(None), None);
  }

  #[test]
  fn installing_requires_confirmation_and_an_ordinary_start_is_not_the_helper() {
    assert!(require_confirmation(false).unwrap_err().contains("saved your work"));
    assert!(require_confirmation(true).is_ok());
    // The test harness's own arguments never carry the helper flag.
    assert!(finish_helper().is_none());
  }

  #[test]
  fn commands_run_one_operation_at_a_time_and_release_it_after_failures() {
    let state = Arc::new(Updates::default());
    let value = tauri::async_runtime::block_on(state.run("stopped", |_| Ok(7)));
    assert_eq!(value, Ok(7));
    let failed: Result<(), String> = tauri::async_runtime::block_on(state.run("stopped", |_| Err("offline".into())));
    assert_eq!(failed, Err("offline".into()));
    let held = state.begin().expect("guard released after a failure");
    let busy = tauri::async_runtime::block_on(state.run("stopped", |_| Ok(())));
    assert!(busy.unwrap_err().contains("already running"));
    drop(held);
    let panicked: Result<(), String> = tauri::async_runtime::block_on(state.run("The update check stopped unexpectedly", |_| panic!("worker crashed")));
    assert!(panicked.unwrap_err().starts_with("The update check stopped unexpectedly:"));
    assert!(state.begin().is_ok(), "a crashed worker still releases the guard");
  }

  #[test]
  fn only_a_replaceable_idle_copy_can_offer_installation() {
    let release = Release { tag: "artcraft-v99.0.0".into(), ..Release::default() };
    assert!(!update_info(Some(&release), false, false).can_install);
    assert!(!update_info(Some(&release), true, true).can_install);
    assert!(!update_info(None, true, false).can_install);
    assert_eq!(update_info(Some(&release), false, false).maybe_available_version.as_deref(), Some("artcraft-v99.0.0"));
    assert_eq!(APP.bundle_id(), "ai.artcraft.app");
  }

  #[test]
  fn operations_are_serialized_and_errors_release_the_guard() {
    let state = Arc::new(Updates::default());
    let first = state.begin().expect("first check");
    assert!(state.begin().is_err());
    drop(first);
    assert!(state.begin().is_ok());
    assert!(state.maybe_release.lock().expect("state").is_none());
  }

  #[test]
  fn a_manual_check_offers_a_matching_idle_install_and_defers_its_helper_until_exit() {
    let state = Updates::default();
    let backend = FakeBackend::default();
    let info = state.check_with(&backend).expect("checked");
    assert!(info.can_install);
    state.install_with(&backend).expect("prepared");
    assert!(backend.exit_requested.load(Ordering::Acquire));
    assert!(!backend.helper_started.load(Ordering::Acquire));
    assert!(!state.prevents_exit(), "the prepared update may exit normally");
    state.finish();
    assert!(backend.helper_started.load(Ordering::Acquire));
    state.finish();
    assert_eq!(backend.helper_runs.load(Ordering::Acquire), 1, "exit events cannot run a helper twice");
  }

  #[test]
  fn a_pin_stops_network_checks_and_replacement() {
    let state = Updates::default();
    let backend = FakeBackend::default();
    backend.pinned.store(true, Ordering::Release);
    assert!(state.check_with(&backend).unwrap_err().contains("pinned"));
    assert!(!backend.checked.load(Ordering::Acquire));
    assert!(state.install_with(&backend).unwrap_err().contains("pinned"));
    assert!(!state.prevents_exit());
    assert!(!backend.exit_requested.load(Ordering::Acquire));
  }

  #[test]
  fn running_tasks_allow_a_check_but_block_the_install() {
    let state = Updates::default();
    let backend = FakeBackend::default();
    backend.busy.store(true, Ordering::Release);
    let info = state.check_with(&backend).expect("checking while busy");
    assert!(info.tasks_running);
    assert!(!info.can_install);
    assert!(state.install_with(&backend).unwrap_err().contains("busy"));
    assert!(!state.prevents_exit());
    assert!(!backend.exit_requested.load(Ordering::Acquire));
  }

  #[test]
  fn a_pin_or_task_started_during_download_stops_replacement_and_exit() {
    for pin in [false, true] {
      let state = Updates::default();
      let backend = FakeBackend::default();
      state.check_with(&backend).expect("checked");
      backend.pin_during_download.store(pin, Ordering::Release);
      backend.task_during_download.store(!pin, Ordering::Release);
      assert!(state.install_with(&backend).is_err());
      assert!(!state.prevents_exit(), "failed installation releases the close guard");
      assert!(!backend.exit_requested.load(Ordering::Acquire));
      assert!(state.maybe_restart.lock().expect("restart state").is_none());
    }
  }

  #[test]
  fn an_install_requires_a_previous_check_and_a_replaceable_matching_copy() {
    let state = Updates::default();
    let backend = FakeBackend::default();
    assert!(state.install_with(&backend).unwrap_err().contains("Check for updates"));
    state.check_with(&backend).expect("checked");
    backend.managed.store(true, Ordering::Release);
    assert!(!state.check_with(&backend).expect("managed check").can_install);
    assert!(state.install_with(&backend).unwrap_err().contains("package manager"));
    backend.managed.store(false, Ordering::Release);
    backend.missing_install.store(true, Ordering::Release);
    assert!(!state.check_with(&backend).expect("unknown install").can_install);
    assert!(state.install_with(&backend).unwrap_err().contains("cannot update"));
    backend.missing_install.store(false, Ordering::Release);
    backend.wrong_arch.store(true, Ordering::Release);
    assert!(!state.check_with(&backend).expect("no matching asset").can_install);
    assert!(state.install_with(&backend).unwrap_err().contains("package manager"));
    assert!(!backend.exit_requested.load(Ordering::Acquire));
  }

  #[test]
  fn no_new_release_clears_a_previous_offer_and_a_failed_check_is_reported() {
    let state = Updates::default();
    let backend = FakeBackend::default();
    state.check_with(&backend).expect("first check");
    backend.no_release.store(true, Ordering::Release);
    assert!(!state.check_with(&backend).expect("current version").can_install);
    assert!(state.maybe_release.lock().expect("release").is_none());
    backend.network_error.store(true, Ordering::Release);
    assert!(state.check_with(&backend).unwrap_err().contains("offline"));
  }

  #[test]
  fn a_failed_download_never_requests_exit_or_keeps_the_close_guard() {
    let state = Updates::default();
    let backend = FakeBackend::default();
    state.check_with(&backend).expect("check");
    backend.download_error.store(true, Ordering::Release);
    assert!(state.install_with(&backend).unwrap_err().contains("download"));
    assert!(!state.prevents_exit());
    assert!(!backend.exit_requested.load(Ordering::Acquire));
  }

  #[test]
  fn poisoned_state_returns_an_error_and_refuses_an_unsafe_exit() {
    let state = Arc::new(Updates::default());
    let other = Arc::clone(&state);
    let _ = std::thread::spawn(move || {
      let _guard = other.maybe_release.lock().unwrap();
      panic!("simulate a previous worker failure");
    })
    .join();
    let backend = FakeBackend::default();
    assert!(state.check_with(&backend).is_err());
    assert!(state.install_with(&backend).is_err());
    let other = Arc::clone(&state);
    let _ = std::thread::spawn(move || {
      let _guard = other.maybe_restart.lock().unwrap();
      panic!("simulate a previous helper-state failure");
    })
    .join();
    state.installing.store(true, Ordering::Release);
    assert!(state.prevents_exit());
    state.finish();
  }

  #[test]
  fn every_supported_install_kind_requires_its_own_asset() {
    use craft_update::{Arch, Asset};
    let linux = Platform { os: Os::Linux, arch: Arch::X64 };
    let windows = Platform { os: Os::Windows, arch: Arch::X64 };
    let release = Release { assets: ["artcraft-99.0.0-linux-x86_64.AppImage", "artcraft-99.0.0-linux-x86_64.tar.gz", "artcraft-99.0.0-linux-x86_64.deb", "artcraft-99.0.0-windows-x64-portable.zip"].into_iter().map(|name| Asset { name: name.into(), ..Asset::default() }).collect(), ..Release::default() };
    for install in [Install::AppImage("unused".into()), Install::Standalone("unused".into()), Install::Package(PackageKind::Deb, "unused".into())] {
      assert!(release_fits_copy(&release, &install, linux));
    }
    assert!(release_fits_copy(&release, &Install::Portable("unused".into()), windows));
    assert!(!release_fits_copy(&release, &Install::Package(PackageKind::Rpm, "unused".into()), linux));
  }

  #[derive(Default)]
  struct FakeBackend {
    pinned: AtomicBool,
    busy: AtomicBool,
    managed: AtomicBool,
    missing_install: AtomicBool,
    wrong_arch: AtomicBool,
    no_release: AtomicBool,
    network_error: AtomicBool,
    download_error: AtomicBool,
    pin_during_download: AtomicBool,
    task_during_download: AtomicBool,
    checked: AtomicBool,
    exit_requested: AtomicBool,
    helper_started: Arc<AtomicBool>,
    helper_runs: Arc<std::sync::atomic::AtomicUsize>,
  }

  impl Backend for FakeBackend {
    fn stable_choice(&self) -> Result<(), String> {
      if self.pinned.load(Ordering::Acquire) {
        Err("pinned".into())
      } else {
        Ok(())
      }
    }
    fn check(&self) -> Result<Option<Release>, String> {
      self.checked.store(true, Ordering::Release);
      if self.network_error.load(Ordering::Acquire) {
        return Err("offline".into());
      }
      Ok((!self.no_release.load(Ordering::Acquire)).then(|| Release { tag: "artcraft-v99.0.0".into(), assets: vec![craft_update::Asset { name: "artcraft-99.0.0-linux-x86_64.flatpak".into(), ..Default::default() }], ..Default::default() }))
    }
    fn idle(&self) -> Result<(), String> {
      if self.busy.load(Ordering::Acquire) {
        Err("busy".into())
      } else {
        Ok(())
      }
    }
    fn installation(&self) -> Option<(Install, Platform)> {
      (!self.missing_install.load(Ordering::Acquire)).then(|| (Install::Flatpak, Platform { os: Os::Linux, arch: if self.wrong_arch.load(Ordering::Acquire) { craft_update::Arch::Arm64 } else { craft_update::Arch::X64 } }))
    }
    fn can_replace(&self) -> bool {
      !self.managed.load(Ordering::Acquire)
    }
    fn prepare(&self, _: &Install, _: &Release, _: Platform, before_replace: &dyn Fn() -> Result<(), String>) -> Result<Restart, String> {
      if self.download_error.load(Ordering::Acquire) {
        return Err("download failed".into());
      }
      if self.pin_during_download.load(Ordering::Acquire) {
        self.pinned.store(true, Ordering::Release);
      }
      if self.task_during_download.load(Ordering::Acquire) {
        self.busy.store(true, Ordering::Release);
      }
      before_replace()?;
      let started = Arc::clone(&self.helper_started);
      let runs = Arc::clone(&self.helper_runs);
      Ok(Box::new(move || {
        started.store(true, Ordering::Release);
        runs.fetch_add(1, Ordering::AcqRel);
        Ok(())
      }))
    }
    fn request_exit(&self) {
      self.exit_requested.store(true, Ordering::Release);
    }
  }
}
