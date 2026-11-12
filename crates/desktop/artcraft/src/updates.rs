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
  maybe_restart: Mutex<Option<self_update::Restart>>,
}

#[derive(Debug, Serialize)]
pub struct UpdateInfo {
  pub current_version: String,
  pub maybe_available_version: Option<String>,
  pub can_install: bool,
  pub tasks_running: bool,
  pub releases_url: String,
}

struct Installing<'a>(&'a AtomicBool);

pub(crate) struct Operation {
  updates: Arc<Updates>,
}

impl Updates {
  pub(crate) fn begin(self: &Arc<Self>) -> Result<Operation, String> {
    self.busy.compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire).map_err(|_| "An update operation is already running. Please wait.".to_owned())?;
    Ok(Operation { updates: Arc::clone(self) })
  }

  pub(crate) fn check(&self, app: &AppHandle) -> Result<UpdateInfo, String> {
    stable_choice()?;
    let http = Http::new(&format!("ArtCraft/{ARTCRAFT_VERSION}"))?;
    let maybe_release = craft_update::check_for_update(&APP, &http, ARTCRAFT_VERSION)?;
    let tasks_running = ensure_idle(app).is_err();
    let info = update_info(maybe_release.as_ref(), maybe_release.as_ref().is_some_and(replacement_available), tasks_running);
    *self.maybe_release.lock().map_err(|_| "The update state is unavailable. Restart ArtCraft and try again.")? = maybe_release;
    Ok(info)
  }

  pub(crate) fn install(&self, app: &AppHandle) -> Result<(), String> {
    self.installing.store(true, Ordering::Release);
    let _installing = Installing(&self.installing);
    ensure_idle(app)?;
    stable_choice()?;
    let release = self.maybe_release.lock().map_err(|_| "The update state is unavailable. Restart ArtCraft and try again.")?.clone().ok_or("Check for updates before installing one.")?;
    let install = self_update::current(&APP).ok_or("This installation cannot update itself. Open Releases or use its package manager.")?;
    let platform = Platform::current().ok_or("No installer is available for this platform.")?;
    if !self_update::is_self_updating(&APP) || !release_fits_copy(&release, &install, platform) {
      return Err("Use Releases or your package manager to update this installation.".into());
    }
    let http = Http::new(&format!("ArtCraft/{ARTCRAFT_VERSION}"))?;
    let paths = Paths::for_app(&APP)?;
    // Recheck tasks and launcher choices immediately before replacing any application files.
    let before_replace = || ensure_idle(app).and_then(|()| stable_choice());
    let restart = self_update::prepare_update(&APP, &install, &release, platform, &http, &paths, &Stop::default(), &mut |_| {}, &before_replace, Some(ARTCRAFT_VERSION))?;
    *self.maybe_restart.lock().map_err(|_| "The restart state is unavailable. Restart ArtCraft manually.")? = Some(restart);
    // The helper starts in RunEvent::Exit, after Tauri accepts the normal exit request.
    app.exit(0);
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
          if let Err(error) = restart.start() {
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
  let message = match self_update::take_outcome(&paths, ARTCRAFT_VERSION) {
    Some(self_update::Outcome::Installed(version)) => format!("ArtCraft was updated to {version}."),
    Some(self_update::Outcome::Failed(error)) => format!("The ArtCraft update failed: {error}"),
    None => return,
  };
  app.dialog().message(message).title("ArtCraft update").show(|_| {});
}

fn stable_choice() -> Result<(), String> {
  match Pins::load_default().choice(APP.id) {
    Choice::Stable => Ok(()),
    _ => Err("ArtCraft Launcher manages this app's version. Change its version there.".into()),
  }
}

fn ensure_idle(app: &AppHandle) -> Result<(), String> {
  let db = app.try_state::<TaskDatabase>().ok_or("ArtCraft is still starting. Try checking again in a moment.")?;
  let tasks = tauri::async_runtime::block_on(list_tasks_for_frontend(db.get_connection())).map_err(|error| format!("Could not check running tasks: {error}"))?;
  if tasks.tasks.iter().any(|task| active_task(task.status)) {
    Err("Finish or cancel running tasks before installing an update.".into())
  } else {
    Ok(())
  }
}

fn active_task(status: TaskStatus) -> bool {
  matches!(status, TaskStatus::Pending | TaskStatus::Started | TaskStatus::AttemptFailed)
}

fn replacement_available(release: &Release) -> bool {
  if !self_update::is_self_updating(&APP) {
    return false;
  }
  match (self_update::current(&APP), Platform::current()) {
    (Some(install), Some(platform)) => release_fits_copy(release, &install, platform),
    _ => false,
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
}
