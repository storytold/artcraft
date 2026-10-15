//! Craft AI: the ArtCraft family's built-in assistant, as a page of the app.
//!
//! Craft AI is a local Gemma 4 model the user chooses to download — never a cloud service. The
//! page has three tabs:
//!
//! * **Assistant** — the app-specialised tasks of [`tasks`], asked of the model the user picked;
//!   answers arrive from a local model runtime ([`engine`]) on a worker thread.
//! * **Models** — the Gemma 4 catalogue ([`models`]) with each model's disk size and RAM need
//!   next to what this machine has, and the downloads: pulled by the runtime, or saved into the
//!   shared folder every ArtCraft app reads ([`hub`]) — one download serves them all.
//! * **About** — what runs where, and its honest limits.
//!
//! Downloading is optional; without a model the page says so and nothing touches the network
//! beyond loopback. Craft AI is the family's, not this app's: the model files live in a shared
//! folder beside all the ArtCraft apps, one download of a model serves every app, and any model
//! a runtime already has is offered here the moment its app is opened. The native page lives in
//! [`desktop`] — the web build shows a note instead, as a local runtime and worker threads are
//! of the native world.

#[cfg(not(target_arch = "wasm32"))]
mod desktop;
#[cfg(not(target_arch = "wasm32"))]
mod engine;
#[cfg(not(target_arch = "wasm32"))]
mod hub;
#[cfg(not(target_arch = "wasm32"))]
mod models;
#[cfg(not(target_arch = "wasm32"))]
mod tasks;
#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests;

use egui::Ui;

/// The page. Native only: a local model runtime and worker threads are of that world; the web
/// build shows a note instead.
pub fn show(ui: &mut Ui) {
  #[cfg(target_arch = "wasm32")]
  {
    dim(ui, &crate::i18n::t("Craft AI runs in the native app — it needs a local model runtime."));
  }
  #[cfg(not(target_arch = "wasm32"))]
  {
    desktop::show(ui);
  }
}

/// A quiet aside line, the style the app's other pages use for theirs.
#[cfg(target_arch = "wasm32")]
fn dim(ui: &mut Ui, text: &str) {
  ui.label(egui::RichText::new(text).size(12.0).color(crate::theme::MUTED));
}
