//! The native page: everything the web build's note stands in for.

use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use egui::{Context, Ui};

use super::{engine, hub, models, tasks};
use crate::theme;
use crate::ui::widgets;
use crate::i18n::{t, tf};

/// Lock the page's state. A poisoned lock (a worker thread that died mid-answer) still hands
/// back its data: the state is UI state, and a worker that panicked is a lost answer, not a
/// broken app — the same recovery the app's other background work uses.
fn lock(state: &Arc<Mutex<State>>) -> std::sync::MutexGuard<'_, State> {
  state.lock().unwrap_or_else(|e| e.into_inner())
}

/// Which tab the page shows.
#[derive(Clone, Copy, PartialEq)]
enum Tab {
  Assistant,
  Models,
  About,
}

impl Tab {
  fn label(self) -> &'static str {
    match self {
      Self::Assistant => "Assistant",
      Self::Models => "Models",
      Self::About => "About",
    }
  }
}

/// What the one background job is doing right now (a second click waits for it). Pulls and
/// saves carry their model's id, so a progress line shows under its own model's card only.
enum Work {
  None,
  /// Looking for runtimes and reading the machine's figures.
  Detecting,
  /// Asking the model a question.
  Asking,
  /// The runtime is pulling a model; the last progress line, and its bytes when it streams.
  Pulling { id: &'static str, note: String, done: u64, total: u64 },
  /// The shared folder is being filled; how many bytes of the file are done.
  Saving { id: &'static str, done: u64, total: u64 },
}

/// The page's state, shared with its worker threads.
struct State {
  tab: Tab,
  /// First open: what runtimes, models and machine figures were found.
  detected: bool,
  runtimes: Vec<engine::Runtime>,
  runtime: usize,
  installed: Vec<String>,
  model: usize,
  device: Option<models::Device>,
  saved: Vec<String>,
  task: usize,
  input: String,
  /// The conversation so far, oldest first.
  history: Vec<engine::ChatMessage>,
  error: Option<String>,
  work: Work,
  started: Option<Instant>,
}

impl Default for State {
  fn default() -> Self {
    Self {
      tab: Tab::Assistant,
      detected: false,
      runtimes: Vec::new(),
      runtime: 0,
      installed: Vec::new(),
      model: 0,
      device: None,
      saved: Vec::new(),
      task: 0,
      input: String::new(),
      history: Vec::new(),
      error: None,
      work: Work::None,
      started: None,
    }
  }
}

impl State {
  fn busy(&self) -> bool {
    !matches!(self.work, Work::None)
  }
}

/// The page's state, created on first draw and kept in the egui data.
fn state(ctx: &Context) -> Arc<Mutex<State>> {
  let id = egui::Id::new("craft-ai-state");
  if let Some(s) = ctx.data(|d| d.get_temp::<Arc<Mutex<State>>>(id)) {
    return s;
  }
  let s = Arc::new(Mutex::new(State::default()));
  ctx.data_mut(|d| d.insert_temp(id, s.clone()));
  s
}

/// A quiet aside line, the style the app's other pages use for theirs.
fn dim(ui: &mut Ui, text: &str) {
  ui.label(egui::RichText::new(text).size(12.0).color(theme::MUTED));
}

/// The page's native body.
pub(super) fn show(ui: &mut Ui) {
  let ctx = ui.ctx().clone();
  let state = state(&ctx);
  {
    let s = &mut *lock(&state);
    if !s.detected {
      s.detected = true;
      s.work = Work::Detecting;
      spawn_detect(&ctx, &state);
    }
    // A busy timer should tick even when the pointer is still.
    if s.busy() {
      ui.ctx().request_repaint_after(Duration::from_millis(250));
    }
  }
  ui.add_space(4.0);
  ui.horizontal(|ui| {
    for tab in [Tab::Assistant, Tab::Models, Tab::About] {
      let selected = lock(&state).tab == tab;
      if ui.add(egui::Button::selectable(selected, t(tab.label()))).clicked() {
        lock(&state).tab = tab;
      }
    }
  });
  ui.add_space(4.0);
  match lock(&state).tab {
    Tab::Assistant => assistant(ui, &ctx, &state),
    Tab::Models => model_cards(ui, &ctx, &state),
    Tab::About => about(ui),
  }
}

/// The Assistant tab: runtime and model pickers, the task, the question, the answer.
fn assistant(ui: &mut Ui, ctx: &Context, state: &Arc<Mutex<State>>) {
  let mut detect = false;
  let mut ask: Option<(engine::Runtime, String, String)> = None;
  {
    let s = &mut *lock(state);
    if s.runtimes.is_empty() {
      if matches!(s.work, Work::Detecting) {
        ui.horizontal(|ui| {
          ui.spinner();
          dim(ui, &t("Looking for a local model runtime…"));
        });
      } else {
        ui.label(egui::RichText::new(t("No local model runtime found.")).color(theme::INK));
        ui.add_space(4.0);
        ui.label(
          egui::RichText::new(t("Craft AI talks to a model runtime on this machine — Ollama, LM Studio or llama.cpp's server — and never to a cloud service. Start one, then Refresh."))
            .size(12.0)
            .weak(),
        );
        if widgets::button(ui, None, &t("Refresh"), widgets::Kind::Secondary, 88.0, 26.0).clicked() {
          detect = true;
        }
      }
    } else {
      let rt = s.runtimes[s.runtime.min(s.runtimes.len() - 1)];
      let names: Vec<String> = s.runtimes.iter().map(|r| r.to_string()).collect();
      widgets::section_label(ui, &t("Runtime"), theme::MUTED);
      let current_rt = names[s.runtime.min(names.len() - 1)].clone();
      egui::ComboBox::from_id_salt("craft-ai-runtime")
        .selected_text(current_rt)
        .width(ui.available_width())
        .show_ui(ui, |ui| {
          for (i, name) in names.iter().enumerate() {
            ui.selectable_value(&mut s.runtime, i, name.clone());
          }
        });
      if s.installed.is_empty() {
        if !matches!(s.work, Work::Detecting) {
          dim(ui, &t("No model installed yet — see the Models tab."));
        }
      } else {
        // A Gemma model, if any, is the obvious default; an index that outlived its
        // list lands back on one.
        if s.model >= s.installed.len() {
          s.model = s.installed.iter().position(|m| m.contains("gemma")).unwrap_or(0);
        }
        widgets::section_label(ui, &t("Model"), theme::MUTED);
        let current_model = s.installed[s.model.min(s.installed.len() - 1)].clone();
        egui::ComboBox::from_id_salt("craft-ai-model")
          .selected_text(current_model)
          .width(ui.available_width())
          .show_ui(ui, |ui| {
            let mut idx = s.model.min(s.installed.len() - 1);
            for (i, name) in s.installed.iter().enumerate() {
              ui.selectable_value(&mut idx, i, name.clone());
            }
            s.model = idx.min(s.installed.len() - 1);
          });
        let labels: Vec<&str> = tasks::TASKS.iter().map(|task| task.label).collect();
        widgets::section_label(ui, &t("Task"), theme::MUTED);
        let mut task = s.task.min(labels.len() - 1);
        egui::ComboBox::from_id_salt("craft-ai-task")
          .selected_text(t(labels[task]))
          .width(ui.available_width())
          .show_ui(ui, |ui| {
            for (i, label) in labels.iter().enumerate() {
              ui.selectable_value(&mut task, i, t(label));
            }
          });
        s.task = task;
        ui.add_space(4.0);
        let hint = t(tasks::TASKS[s.task.min(tasks::TASKS.len() - 1)].hint);
        ui.add(
          egui::TextEdit::multiline(&mut s.input)
            .hint_text(hint)
            .desired_rows(4)
            .desired_width(f32::INFINITY)
            .font(egui::FontId::proportional(12.0)),
        );
        ui.add_space(2.0);
        ui.horizontal(|ui| {
          let busy = s.busy();
          let ready = !busy && !s.input.trim().is_empty();
          if widgets::button(ui, None, &t("Ask"), widgets::Kind::Primary, 72.0, 26.0).clicked() && ready {
            let model = s.installed[s.model.min(s.installed.len() - 1)].clone();
            ask = Some((rt, model, tasks::user_prompt(s.task, &s.input)));
          }
          if !s.history.is_empty() && !busy && widgets::button(ui, None, &t("Clear"), widgets::Kind::Secondary, 72.0, 26.0).clicked() {
            s.history.clear();
          }
          if busy {
            ui.spinner();
            let secs = s.started.map(|at| at.elapsed().as_secs()).unwrap_or(0);
            dim(ui, &tf("Thinking… {}s", &[secs.to_string()]));
          }
        });
      }
      if let Some(e) = &s.error {
        ui.add_space(4.0);
        ui.label(egui::RichText::new(e).size(12.0).color(theme::INK).weak());
      }
      if !s.history.is_empty() {
        ui.add_space(6.0);
        egui::ScrollArea::vertical().max_height(240.0).show(ui, |ui| {
          let rtl = crate::i18n::is_arabic();
          for m in &s.history {
            if m.role == "user" {
              ui.label(egui::RichText::new(format!("› {}", m.content)).size(12.0).color(theme::DIM));
            } else {
              // What the model says may be Arabic the user wrote in: it keeps its logical
              // order (clipboard order) on arrival and is drawn visual, like every Arabic
              // the interface shows.
              let text = if rtl { crate::i18n::bidi::visual_rtl(&m.content) } else { m.content.clone() };
              ui.add(egui::Label::new(egui::RichText::new(text).size(12.0)).wrap());
              ui.add_space(2.0);
              if widgets::button(ui, None, &t("Copy"), widgets::Kind::Secondary, 64.0, 24.0).clicked() {
                ctx.copy_text(m.content.clone());
              }
            }
          }
        });
      }
    }
  }
  if let Some((rt, model, prompt)) = ask {
    let s = &mut *lock(state);
    s.work = Work::Asking;
    s.started = Some(Instant::now());
    s.error = None;
    let question = s.input.trim().to_string();
    let history = s.history.clone();
    spawn_ask(ctx, state, rt, &model, &history, &question, &prompt);
  }
  if detect {
    let s = &mut *lock(state);
    s.work = Work::Detecting;
    spawn_detect(ctx, state);
  }
}

/// The Models tab: the catalogue with each model's figures, and its download buttons.
fn model_cards(ui: &mut Ui, ctx: &Context, state: &Arc<Mutex<State>>) {
  let mut detect = false;
  let mut pull: Option<&'static models::ModelSpec> = None;
  let mut save: Option<&'static models::ModelSpec> = None;
  let mut remove: Option<&'static models::ModelSpec> = None;
  {
    let s = &mut *lock(state);
    if let Some(d) = &s.device {
      let ram = d.ram_gb.map(|g| g.to_string()).unwrap_or_else(|| "?".into());
      let disk = d.free_gb.map(|g| g.to_string()).unwrap_or_else(|| "?".into());
      dim(ui, &tf("This machine: {} GB RAM, {} GB free", &[ram, disk]));
    } else if matches!(s.work, Work::Detecting) {
      ui.horizontal(|ui| {
        ui.spinner();
        dim(ui, &t("Looking for a local model runtime…"));
      });
    }
    ui.add_space(2.0);
    ui.label(
      egui::RichText::new(t("One download serves every ArtCraft app: the model lands in a shared folder all of them read."))
        .size(12.0)
        .weak(),
    );
    ui.add_space(4.0);
    let ollama = s.runtimes.iter().copied().find(|r| r.kind == engine::RuntimeKind::Ollama);
    for m in models::MODELS {
      ui.add(egui::Label::new(egui::RichText::new(m.name).size(13.0).color(theme::ACCENT_INK)).wrap());
      let (ram_ok, disk_ok) = match &s.device {
        Some(d) => (d.ram_gb.is_none_or(|g| g >= m.ram_gb), d.free_gb.is_none_or(|g| g >= m.bytes / 1_000_000_000)),
        None => (true, true),
      };
      ui.label(egui::RichText::new(format!("{} · {} · {}", m.params, m.context, m.inputs)).size(11.5).color(theme::DIM));
      ui.label(egui::RichText::new(t(m.best)).size(11.5).color(theme::DIM));
      ui.horizontal(|ui| {
        ui.label(egui::RichText::new(tf("Disk {}", &[m.gb()])).size(11.5).color(theme::DIM));
        ui.separator();
        ui.label(egui::RichText::new(tf("RAM {} GB", &[m.ram_gb.to_string()])).size(11.5).color(theme::DIM));
        if s.device.is_some() {
          ui.separator();
          if ram_ok && disk_ok {
            ui.label(egui::RichText::new(t("Fits this machine")).size(11.5).color(theme::ACCENT_INK));
          } else if !ram_ok {
            ui.label(egui::RichText::new(tf("Needs {} GB of RAM", &[m.ram_gb.to_string()])).size(11.5).color(theme::INK));
          } else {
            ui.label(egui::RichText::new(tf("Needs {} GB of disk", &[models::gb(m.bytes)])).size(11.5).color(theme::INK));
          }
        }
      });
      let saved = s.saved.iter().any(|id| id == m.id);
      ui.horizontal(|ui| {
        let busy = s.busy();
        if ollama.is_some() && !busy && widgets::button(ui, None, &t("Download with Ollama"), widgets::Kind::Secondary, 168.0, 24.0).clicked() {
          pull = Some(m);
        }
        if !busy && !saved && widgets::button(ui, None, &t("Save model file"), widgets::Kind::Secondary, 128.0, 24.0).clicked() {
          save = Some(m);
        }
        if !busy && saved && widgets::button(ui, None, &t("Delete file"), widgets::Kind::Secondary, 96.0, 24.0).clicked() {
          remove = Some(m);
        }
      });
      match &s.work {
        Work::Pulling { id, note, done, total } if *id == m.id => {
          ui.horizontal(|ui| {
            ui.spinner();
            let pct = ((*done as f64 / (*total as f64).max(1.0)) * 100.0).round() as u64;
            dim(ui, &tf("Downloading… {}% — {}", &[pct.to_string(), note.clone()]));
          });
        }
        Work::Saving { id, done, total } if *id == m.id => {
          ui.horizontal(|ui| {
            ui.spinner();
            let pct = ((*done as f64 / (*total as f64).max(1.0)) * 100.0).round() as u64;
            dim(ui, &tf("Saving… {}%", &[pct.to_string()]));
          });
        }
        _ if saved => {
          dim(ui, &t("Saved in the shared folder"));
        }
        _ => {}
      }
      if let Some(e) = &s.error {
        ui.label(egui::RichText::new(e).size(11.5).color(theme::INK).weak());
      }
      ui.add_space(6.0);
    }
    if !s.runtimes.is_empty() && !s.busy() && widgets::button(ui, None, &t("Refresh"), widgets::Kind::Secondary, 88.0, 26.0).clicked() {
      detect = true;
    }
  }
  if let Some(m) = pull {
    // The pull button only shows with an Ollama runtime in the picker, but a detection
    // refresh may have emptied it between the click and this frame — a missing runtime is
    // an error line, not a panic.
    let Some(rt) = lock(state).runtimes.iter().copied().find(|r| r.kind == engine::RuntimeKind::Ollama) else {
      lock(state).error = Some(t("Ollama is no longer running — Refresh finds it again."));
      return;
    };
    let s = &mut *lock(state);
    s.work = Work::Pulling { id: m.id, note: String::new(), done: 0, total: 0 };
    s.error = None;
    spawn_pull(ctx, state, rt, m);
  }
  if let Some(m) = save {
    let s = &mut *lock(state);
    s.work = Work::Saving { id: m.id, done: 0, total: m.bytes };
    s.error = None;
    spawn_save(ctx, state, m);
  }
  if let Some(m) = remove {
    lock(state).error = hub::remove(m).err();
    detect = true;
  }
  if detect {
    let s = &mut *lock(state);
    s.work = Work::Detecting;
    spawn_detect(ctx, state);
  }
}

/// The About tab: what runs where, and its honest limits.
fn about(ui: &mut Ui) {
  ui.label(egui::RichText::new(t("Local and private")).size(13.0).color(theme::ACCENT_INK));
  ui.add_space(2.0);
  ui.add(
    egui::Label::new(
      egui::RichText::new(t("Craft AI runs a local Gemma model on this machine. Nothing you write here leaves it: no account, no cloud service, no telemetry — the page talks to a model runtime on 127.0.0.1."))
        .size(12.0),
    )
    .wrap(),
  );
  ui.add_space(6.0);
  ui.label(egui::RichText::new(t("Limits")).size(13.0).color(theme::ACCENT_INK));
  ui.add_space(2.0);
  ui.add(
    egui::Label::new(
      egui::RichText::new(t("A local model is not a frontier cloud model: it can be wrong, and a long answer takes its time on CPU. Check anything critical, and mind a model's size against this machine before downloading it."))
        .size(12.0),
    )
    .wrap(),
  );
  ui.add_space(6.0);
  if let Some(dir) = hub::models_dir() {
    ui.label(egui::RichText::new(t("The shared folder:")).size(12.0).color(theme::DIM));
    ui.add(egui::Label::new(egui::RichText::new(dir.display().to_string()).size(11.5).color(theme::DIM).monospace()).wrap());
  }
}

/// Find the runtimes, their models, the machine's figures and the shared folder — once, off the
/// UI thread.
fn spawn_detect(ctx: &Context, state: &Arc<Mutex<State>>) {
  let ctx = ctx.clone();
  let state = state.clone();
  let state_runtime = lock(&state).runtime;
  spawn("craft-ai-detect", move || {
    let runtimes = engine::detect();
    let installed = runtimes.get(state_runtime).copied().and_then(|rt| engine::installed(rt).ok()).unwrap_or_default();
    let device = models::device(hub::models_dir().as_deref());
    let saved = hub::saved_ids();
    let mut s = lock(&state);
    if s.runtime >= runtimes.len() {
      s.runtime = 0;
    }
    s.runtimes = runtimes;
    s.installed = installed;
    s.device = Some(device);
    s.saved = saved;
    s.work = Work::None;
    ctx.request_repaint();
  });
}

/// Ask the model the question, then bring the answer back.
fn spawn_ask(ctx: &Context, state: &Arc<Mutex<State>>, rt: engine::Runtime, model: &str, history: &[engine::ChatMessage], question: &str, prompt: &str) {
  let ctx = ctx.clone();
  let state = state.clone();
  let model = model.to_string();
  let history = history.to_vec();
  let question = question.to_string();
  let prompt = prompt.to_string();
  spawn("craft-ai-ask", move || {
    let reply = engine::chat(rt, &model, &tasks::system_prompt(), &history, &prompt);
    let mut s = lock(&state);
    match reply {
      Ok(answer) => {
        s.history.push(engine::ChatMessage { role: "user", content: question });
        s.history.push(engine::ChatMessage { role: "assistant", content: answer });
        // Keep the oldest turns out of the context when the conversation grows.
        if s.history.len() > 12 {
          let cut = s.history.len() - 12;
          s.history.drain(..cut);
        }
        s.input.clear();
        s.error = None;
      }
      Err(e) => s.error = Some(e),
    }
    s.work = Work::None;
    s.started = None;
    ctx.request_repaint();
  });
}

/// Have Ollama pull the model (its own download manager, into its own store — shared by every
/// app on this machine in its own way).
fn spawn_pull(ctx: &Context, state: &Arc<Mutex<State>>, rt: engine::Runtime, m: &'static models::ModelSpec) {
  let ctx = ctx.clone();
  let state = state.clone();
  let tag = m.ollama.to_string();
  spawn("craft-ai-pull", move || {
    let reply = engine::pull(rt, &tag, &mut |note, progress| {
      let mut s = lock(&state);
      if let Work::Pulling { note: n, done, total, .. } = &mut s.work {
        *n = note.to_string();
        if let Some((d, t)) = progress {
          *done = d;
          *total = t;
        }
      }
      ctx.request_repaint();
    });
    let mut s = lock(&state);
    match reply {
      Ok(()) => s.error = None,
      Err(e) => s.error = Some(e),
    }
    s.work = Work::None;
    ctx.request_repaint();
  });
}

/// Download the model file into the shared folder every ArtCraft app reads.
fn spawn_save(ctx: &Context, state: &Arc<Mutex<State>>, m: &'static models::ModelSpec) {
  let ctx = ctx.clone();
  let state = state.clone();
  let spec = m;
  spawn("craft-ai-save", move || {
    let reply = hub::save(spec, tasks::APP, &mut |done, total| {
      let mut s = lock(&state);
      if let Work::Saving { done: d, total: t, .. } = &mut s.work {
        *d = done;
        *t = total;
      }
      ctx.request_repaint();
    });
    let mut s = lock(&state);
    match reply {
      Ok(()) => {
        s.saved = hub::saved_ids();
        s.error = None;
      }
      Err(e) => s.error = Some(e),
    }
    s.work = Work::None;
    ctx.request_repaint();
  });
}

/// Run `body` on a named worker thread; if threads are unavailable the page's error line says
/// so on the next draw.
fn spawn(name: &str, body: impl FnOnce() + Send + 'static) {
  let _ = std::thread::Builder::new().name(name.to_string()).spawn(body);
}
