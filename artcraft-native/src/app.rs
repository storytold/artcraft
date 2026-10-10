//! The app: owns the backend, the pages and the overlays; routes backend events to whoever is
//! waiting for them and page requests to the services that fulfil them.

use std::collections::{HashMap, HashSet};
use std::time::Duration;

use egui::{Id, Ui};
use serde::{Deserialize, Serialize};

use crate::backend::audio::AudioPlayer;
use crate::backend::media_cache::MediaCache;
use crate::backend::wire::{Prompt, SessionUser};
use crate::backend::{Backend, Event, Modality, SHARE_URL_BASE};
use crate::feed::grid::{RatioCache, ViewMode};
use crate::feed::store::{FeedNotice, FeedStore};
use crate::feed::types::{FeedItem, MediaKind};
use crate::models::Catalog;
use crate::backend::wire::{Character, JobPhase};
use crate::overlays::account::{LoginAction, LoginDialog, SettingsAction, settings_dialog};
use crate::overlays::characters::{CharactersAction, CharactersModal};
use crate::overlays::library_picker::{LibraryPicker, PickerAction};
use crate::overlays::lightbox::{Lightbox, LightboxAction, fit_inside};
use crate::pages::common::{self, AppRequest, Env, FeedKey};
use crate::pages::create_image::{CreateImagePage, ImageSettings};
use crate::pages::create_video::{CreateVideoPage, VideoSettings};
use crate::pages::other;
use crate::prompt_box::refs::{RefKind, RefMedia};
use crate::shell::{self, Account, FeedToggles, Page, ShellAction};
use crate::theme;
use crate::ui::toast::Toasts;
use crate::ui::{creator_icons, widgets, window};

/// Builds the page environment from the app's fields (disjoint borrows, so pages can be
/// borrowed mutably alongside it).
macro_rules! env {
  ($app:ident, $ctx:expr) => {
    Env { ctx: $ctx.clone(), backend: &$app.backend, cache: &mut $app.cache, toasts: &mut $app.toasts, catalog: &$app.catalog, signed_in: $app.user.is_some(), enter_to_generate: $app.enter_to_generate, view_mode: $app.view_mode, autoplay: $app.autoplay, ratios: &mut $app.ratios, prompts: &$app.prompts, requests: &mut $app.requests, characters: &$app.characters }
  };
}

const STORAGE_KEY: &str = "artcraft-native";
const JOB_POLL_INTERVAL: f64 = 5.0;
const CREDITS_INTERVAL: f64 = 60.0;
const MODEL_RETRY_INTERVAL: f64 = 15.0;
/// List view: prompt records fetched per frame at most.
const PROMPT_FETCHES_PER_FRAME: usize = 8;

/// Preferences that survive restarts.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default)]
struct Saved {
  page: Page,
  enter_to_generate: bool,
  view_mode: ViewMode,
  autoplay: bool,
  sidebar_open: bool,
  image: ImageSettings,
  video: VideoSettings,
}

impl Default for Saved {
  fn default() -> Self {
    Self { page: Page::CreateImage, enter_to_generate: false, view_mode: ViewMode::Grid, autoplay: true, sidebar_open: true, image: ImageSettings { count: 1, ..Default::default() }, video: VideoSettings::default() }
  }
}

pub struct ArtcraftApp {
  backend: Backend,
  cache: MediaCache,
  audio: AudioPlayer,
  toasts: Toasts,
  catalog: Catalog,
  user: Option<SessionUser>,
  credits: Option<u64>,
  page: Page,
  enter_to_generate: bool,
  view_mode: ViewMode,
  autoplay: bool,
  sidebar_open: bool,
  image: CreateImagePage,
  video: CreateVideoPage,
  library: FeedStore,
  ratios: RatioCache,
  /// Prompt texts by prompt token (list view, lightbox).
  prompts: HashMap<String, String>,
  prompt_records: HashMap<String, Prompt>,
  requested_prompts: HashSet<String>,
  /// A Recreate waiting for its prompt record.
  pending_recreate: Option<(MediaKind, String)>,
  /// Which feed a batch expansion belongs to.
  batch_kinds: HashMap<String, MediaKind>,
  lightbox: Option<Lightbox>,
  picker: Option<LibraryPicker>,
  login: Option<LoginDialog>,
  characters_modal: Option<CharactersModal>,
  characters: Vec<Character>,
  /// Characters being made: (job token, name).
  pending_characters: Vec<(String, String)>,
  settings_open: bool,
  preview: Option<String>,
  requests: Vec<AppRequest>,
  screenshot: Option<ScreenshotRequest>,
  next_poll: f64,
  next_credits: f64,
  models_retry_at: Option<f64>,
}

impl ArtcraftApp {
  pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
    theme::apply(&cc.egui_ctx);
    egui_extras::install_image_loaders(&cc.egui_ctx);
    let mut saved: Saved = cc.storage.and_then(|s| eframe::get_value(s, STORAGE_KEY)).unwrap_or_default();
    if let Some(page) = std::env::var("ARTCRAFT_PAGE").ok().and_then(|p| Page::from_slug(&p)) {
      saved.page = page;
    }
    let backend = Backend::new(cc.egui_ctx.clone());
    let cache = MediaCache::new(backend.runtime(), backend.http());
    let audio = AudioPlayer::new(backend.runtime(), backend.http());
    backend.load_models(Modality::Image);
    backend.load_models(Modality::Video);
    backend.refresh_session();
    Self { cache, audio, toasts: Toasts::default(), catalog: Catalog::default(), user: None, credits: None, page: saved.page, enter_to_generate: saved.enter_to_generate, view_mode: saved.view_mode, autoplay: saved.autoplay, sidebar_open: saved.sidebar_open, image: CreateImagePage::new(saved.image), video: CreateVideoPage::new(saved.video), library: FeedStore::default(), ratios: RatioCache::default(), prompts: HashMap::new(), prompt_records: HashMap::new(), requested_prompts: HashSet::new(), pending_recreate: None, batch_kinds: HashMap::new(), lightbox: None, picker: None, login: None, characters_modal: None, characters: Vec::new(), pending_characters: Vec::new(), settings_open: false, preview: None, requests: Vec::new(), screenshot: ScreenshotRequest::from_env(), next_poll: 0.0, next_credits: CREDITS_INTERVAL, models_retry_at: None, backend }
  }

  // --- Events from the backend -------------------------------------------------------------

  fn handle_event(&mut self, ctx: &egui::Context, event: Event) {
    match event {
      Event::Session(user) => {
        let changed = self.user.as_ref().map(|u| &u.username) != user.as_ref().map(|u| &u.username);
        self.user = user;
        if changed {
          self.image.feed.reset();
          self.video.feed.reset();
          self.library.reset();
          self.next_poll = 0.0;
        }
        if self.user.is_some() {
          self.login = None;
          if changed {
            self.backend.load_characters();
          }
        } else {
          self.credits = None;
          if let Some(login) = &mut self.login {
            login.busy = false;
          }
        }
      },
      Event::LoginFailed(message) => {
        if let Some(login) = &mut self.login {
          login.busy = false;
          login.device = None;
          login.error = Some(message);
        }
      },
      Event::DeviceLogin { url, code } => {
        if let Some(login) = &mut self.login {
          login.device = Some((url, code));
        }
      },
      Event::Credits(credits) => self.credits = Some(credits),
      Event::Models(modality, Ok(models)) => match modality {
        Modality::Image => self.catalog.set_image(models),
        Modality::Video => self.catalog.set_video(models),
      },
      Event::Models(_, Err(message)) => {
        if self.models_retry_at.is_none() {
          self.toasts.error(format!("Couldn't load models: {message}"));
        }
        self.models_retry_at = Some(ctx.input(|i| i.time) + MODEL_RETRY_INTERVAL);
      },
      Event::Cost { key, credits } => {
        self.image.cost.apply(&key, credits);
        self.video.cost.apply(&key, credits);
      },
      Event::Enqueued { modality, job_tokens, meta } => {
        let mut env = env!(self, ctx);
        match modality {
          Modality::Image => self.image.on_enqueued(&mut env, &job_tokens, &meta),
          Modality::Video => self.video.on_enqueued(&mut env, &job_tokens, &meta),
        }
        self.next_poll = ctx.input(|i| i.time) + 2.0;
      },
      Event::EnqueueFailed { modality, message } => {
        let mut env = env!(self, ctx);
        match modality {
          Modality::Image => self.image.on_enqueue_failed(&mut env, &message),
          Modality::Video => self.video.on_enqueue_failed(&mut env, &message),
        }
      },
      Event::Uploaded { ref_id, result } => {
        if let Some(modal) = &mut self.characters_modal {
          match modal.apply_upload(ref_id, result.clone()) {
            Some(Err(err)) => {
              self.toasts.error(format!("Failed to upload the reference image: {err}"));
              return;
            },
            Some(Ok(())) => return,
            None => {},
          }
        }
        if self.image.refs.find_mut(ref_id).is_some() {
          common::apply_upload(&mut self.toasts, &mut self.image.refs, ref_id, result);
        } else if common::apply_upload(&mut self.toasts, &mut self.video.refs, ref_id, result) {
          let mut env = env!(self, ctx);
          self.video.check_durations(&mut env, ref_id);
        }
      },
      Event::Jobs(jobs) => {
        // Characters being made finish as jobs too.
        let before = self.pending_characters.len();
        let toasts = &mut self.toasts;
        self.pending_characters.retain(|(job, name)| match jobs.iter().find(|j| &j.job_token == job).map(|j| j.status.phase()) {
          Some(JobPhase::Succeeded) => false,
          Some(JobPhase::Failed) => {
            toasts.error(format!("Character \u{201c}{name}\u{201d} failed to create"));
            false
          },
          _ => true,
        });
        if self.pending_characters.len() != before {
          self.backend.load_characters();
        }
        for (kind, notices) in [(MediaKind::Image, self.image.feed.apply_jobs(MediaKind::Image, &jobs, &self.catalog)), (MediaKind::Video, self.video.feed.apply_jobs(MediaKind::Video, &jobs, &self.catalog))] {
          for notice in notices {
            match notice {
              FeedNotice::Completed => {
                self.toasts.success(format!("{} generation complete!", kind.label()));
                self.backend.refresh_credits();
              },
              FeedNotice::Failed(reason) => self.toasts.error(reason),
              FeedNotice::LoadBatch { job_token, batch_token } => {
                self.batch_kinds.insert(job_token.clone(), kind);
                self.backend.load_batch(job_token, batch_token);
              },
            }
          }
        }
      },
      Event::LibraryPage { key, page, items, total_pages } => match key.as_str() {
        "picker" => {
          if let Some(p) = &mut self.picker {
            p.apply_page(page, items, total_pages);
          }
        },
        "image" => self.image.feed.apply_library_page(MediaKind::Image, page, &items, total_pages),
        "video" => self.video.feed.apply_library_page(MediaKind::Video, page, &items, total_pages),
        _ => self.library.apply_library_page(MediaKind::Image, page, &items, total_pages),
      },
      Event::LibraryFailed { key, message } => {
        match key.as_str() {
          "picker" => {
            if let Some(p) = &mut self.picker {
              p.loading = false;
              p.has_more = false;
            }
          },
          "image" => self.image.feed.library_failed(),
          "video" => self.video.feed.library_failed(),
          _ => self.library.library_failed(),
        }
        self.toasts.error(format!("Couldn't load your library: {message}"));
      },
      Event::Batch { job_token, items } => match self.batch_kinds.remove(&job_token) {
        Some(MediaKind::Video) => self.video.feed.apply_batch(MediaKind::Video, &items),
        _ => self.image.feed.apply_batch(MediaKind::Image, &items),
      },
      Event::Prompt(prompt) => {
        if let Some(text) = &prompt.maybe_positive_prompt {
          self.prompts.insert(prompt.token.clone(), text.clone());
        }
        if self.pending_recreate.as_ref().is_some_and(|(_, t)| *t == prompt.token) {
          if let Some((kind, _)) = self.pending_recreate.take() {
            self.apply_recreate(kind, &prompt);
          }
        }
        self.prompt_records.insert(prompt.token.clone(), prompt);
      },
      Event::Characters(list) => self.characters = list,
      Event::CharacterCreating { job_token, name } => {
        self.toasts.success(format!("Character \u{201c}{name}\u{201d} is being created"));
        self.pending_characters.push((job_token, name));
        self.next_poll = 0.0;
      },
      Event::CharacterChanged => self.backend.load_characters(),
      Event::Deleted(token) => {
        for feed in [&mut self.image.feed, &mut self.video.feed, &mut self.library] {
          feed.remove_item(&token);
        }
        if self.lightbox.as_ref().is_some_and(|l| l.token == token) {
          self.lightbox = None;
        }
      },
      Event::Saved(path) => self.toasts.success(format!("Downloaded {}", common::file_name(&path))),
      Event::Toast { error, message } => {
        if error {
          self.toasts.error(message);
        } else {
          self.toasts.success(message);
        }
      },
    }
  }

  // --- Requests from the pages -------------------------------------------------------------

  fn handle_request(&mut self, ctx: &egui::Context, request: AppRequest) {
    match request {
      AppRequest::SignIn => self.open_login(),
      AppRequest::Open { kind, token } => {
        if let Some(item) = self.find_item(&token) {
          self.request_prompt(item.prompt_token.clone());
        }
        self.lightbox = Some(Lightbox::new(kind, token));
      },
      AppRequest::PickFromLibrary { kind, slot, max, page } => {
        let Some(user) = &self.user else {
          self.open_login();
          return;
        };
        let refs = if page == MediaKind::Image { &self.image.refs } else { &self.video.refs };
        let attached: HashSet<String> = refs.list(kind).iter().chain(refs.first_frame.iter()).chain(refs.last_frame.iter()).filter_map(|r| r.token.clone()).collect();
        let mut picker = LibraryPicker::new(kind, slot, page, max, attached);
        picker.loading = true;
        self.backend.load_library("picker".to_owned(), user.username.clone(), picker.media_class(), 0);
        self.picker = Some(picker);
      },
      AppRequest::MakeVideo { token } => {
        let Some(item) = self.find_item(&token) else {
          return;
        };
        let image = RefMedia::from_library(RefKind::Image, item.token.clone(), item.thumbnail.clone(), Some(item.full_url.clone()), 0.0);
        self.video.set_start_image(image);
        self.lightbox = None;
        self.page = Page::CreateVideo;
      },
      AppRequest::Recreate { kind, token } => {
        let Some(prompt_token) = self.find_item(&token).and_then(|i| i.prompt_token.clone()) else {
          self.toasts.error("Could not load the original prompt.");
          return;
        };
        match self.prompt_records.get(&prompt_token).cloned() {
          Some(prompt) => self.apply_recreate(kind, &prompt),
          None => {
            self.pending_recreate = Some((kind, prompt_token.clone()));
            self.requested_prompts.insert(prompt_token.clone());
            self.backend.load_prompt(prompt_token);
          },
        }
      },
      AppRequest::Share(token) => {
        ctx.copy_text(format!("{SHARE_URL_BASE}{token}"));
        self.toasts.success("Share link copied");
      },
      AppRequest::CopyText(text) => {
        ctx.copy_text(text);
        self.toasts.success("Prompt copied");
      },
      AppRequest::Download(tokens) => self.download(&tokens),
      AppRequest::Preview(url) => self.preview = Some(url),
      AppRequest::ToggleAudio { ref_id, url } => self.audio.toggle(ctx, &format!("ref:{ref_id}"), &url),
      AppRequest::OpenCharacters => {
        if self.user.is_none() {
          self.open_login();
          return;
        }
        self.backend.load_characters();
        self.characters_modal = Some(CharactersModal::new());
      },
      AppRequest::PlayExternally(url) => {
        if let Err(err) = open::that(&url) {
          self.toasts.error(format!("Couldn't open the file: {err}"));
        }
      },
      AppRequest::LoadMoreLibrary(key) => {
        let Some(user) = &self.user else {
          return;
        };
        let (feed, name) = match key {
          FeedKey::Image => (&mut self.image.feed, "image"),
          FeedKey::Video => (&mut self.video.feed, "video"),
          FeedKey::Library => (&mut self.library, "library"),
        };
        if let Some(page) = feed.next_library_page() {
          self.backend.load_library(name.to_owned(), user.username.clone(), key.media_classes(), page);
        }
      },
    }
  }

  fn apply_recreate(&mut self, kind: MediaKind, prompt: &Prompt) {
    match kind {
      MediaKind::Image => {
        self.image.apply_prompt(prompt);
        self.page = Page::CreateImage;
      },
      MediaKind::Video => {
        self.video.apply_prompt(prompt);
        self.page = Page::CreateVideo;
      },
    }
    self.lightbox = None;
  }

  fn download(&mut self, tokens: &[String]) {
    let items: Vec<FeedItem> = tokens.iter().filter_map(|t| self.find_item(t).cloned()).collect();
    match items.as_slice() {
      [] => {},
      [item] => {
        let name = file_name_for(item);
        if let Some(path) = rfd::FileDialog::new().set_file_name(&name).save_file() {
          self.backend.save_url(item.full_url.clone(), path);
        }
      },
      many => {
        if let Some(dir) = rfd::FileDialog::new().pick_folder() {
          for item in many {
            self.backend.save_url(item.full_url.clone(), dir.join(file_name_for(item)));
          }
          for feed in [&mut self.image.feed, &mut self.video.feed, &mut self.library] {
            feed.selecting = false;
            feed.selected.clear();
          }
        }
      },
    }
  }

  fn find_item(&self, token: &str) -> Option<&FeedItem> {
    self.image.feed.find(token).or_else(|| self.video.feed.find(token)).or_else(|| self.library.find(token))
  }

  fn request_prompt(&mut self, prompt_token: Option<String>) {
    if let Some(t) = prompt_token {
      if self.requested_prompts.insert(t.clone()) {
        self.backend.load_prompt(t);
      }
    }
  }

  fn open_login(&mut self) {
    if self.login.is_none() {
      self.login = Some(LoginDialog::default());
    }
  }

  /// The feed the top bar's toggles act on.
  fn current_feed(&mut self) -> Option<&mut FeedStore> {
    match self.page {
      Page::CreateImage => Some(&mut self.image.feed),
      Page::CreateVideo => Some(&mut self.video.feed),
      Page::Library => Some(&mut self.library),
      _ => None,
    }
  }

  // --- Frame -------------------------------------------------------------------------------

  fn timers(&mut self, ctx: &egui::Context) {
    let now = ctx.input(|i| i.time);
    if self.user.is_some() && now >= self.next_poll {
      self.next_poll = now + JOB_POLL_INTERVAL;
      self.backend.poll_jobs();
    }
    if self.user.is_some() && now >= self.next_credits {
      self.next_credits = now + CREDITS_INTERVAL;
      self.backend.refresh_credits();
    }
    if self.models_retry_at.is_some_and(|t| now >= t) {
      self.models_retry_at = None;
      if self.catalog.image.is_empty() {
        self.backend.load_models(Modality::Image);
      }
      if self.catalog.video.is_empty() {
        self.backend.load_models(Modality::Video);
      }
    }
    ctx.request_repaint_after(Duration::from_secs(1));
  }

  /// The title bar and the sidebar (both on the window chrome).
  fn shell(&mut self, ui: &mut Ui) {
    let account = Account { username: self.user.as_ref().map(|u| u.username.as_str()), display_name: self.user.as_ref().map(|u| u.display_name.as_str()).filter(|n| !n.is_empty()), credits: self.credits };
    let mark = creator_icons::texture(ui.ctx(), "artcraft");
    let mut actions = Vec::new();
    let chrome = egui::Frame::NONE.fill(theme::CHROME);
    egui::Panel::top("titlebar").exact_size(shell::TITLEBAR_HEIGHT).resizable(false).frame(chrome).show(ui, |ui| {
      actions.extend(shell::titlebar(ui, &account, &mark));
    });
    if self.sidebar_open {
      egui::Panel::left("sidebar").exact_size(shell::SIDEBAR_WIDTH).resizable(false).frame(chrome).show(ui, |ui| {
        actions.extend(shell::sidebar(ui, self.page, &account));
      });
    }
    for action in actions {
      self.apply_shell_action(action);
    }
  }

  fn apply_shell_action(&mut self, action: ShellAction) {
    match action {
      ShellAction::Navigate(page) => {
        self.page = page;
        self.lightbox = None;
      },
      ShellAction::ToggleSidebar => self.sidebar_open = !self.sidebar_open,
      ShellAction::SignIn => self.open_login(),
      ShellAction::SignOut => {
        self.backend.logout();
        self.settings_open = false;
      },
      ShellAction::OpenSettings => self.settings_open = true,
      ShellAction::SetViewMode(mode) => self.view_mode = mode,
      ShellAction::SetAutoplay(on) => self.autoplay = on,
      ShellAction::ToggleSelect => {
        if let Some(feed) = self.current_feed() {
          feed.selecting = !feed.selecting;
          feed.selected.clear();
        }
      },
    }
  }

  /// The content panel: inset from the window edges with rounded corners, its header on top
  /// and the page below.
  fn page_ui(&mut self, ui: &mut Ui) {
    let ctx = ui.ctx().clone();
    let gap = shell::PANEL_GAP;
    let margin = egui::Margin { left: if self.sidebar_open { 0 } else { gap }, right: gap, top: 0, bottom: gap };
    let toggles = match self.page {
      Page::CreateImage => Some(FeedToggles { mode: self.view_mode, selecting: self.image.feed.selecting, autoplay: None }),
      Page::CreateVideo => Some(FeedToggles { mode: self.view_mode, selecting: self.video.feed.selecting, autoplay: Some(self.autoplay) }),
      Page::Library => Some(FeedToggles { mode: self.view_mode, selecting: self.library.selecting, autoplay: Some(self.autoplay) }),
      _ => None,
    };
    let mut header_action = None;
    egui::CentralPanel::default().frame(egui::Frame::NONE.fill(theme::CHROME).inner_margin(margin)).show(ui, |ui| {
      let panel = egui::Frame::new().fill(theme::BG).stroke(theme::hairline()).corner_radius(shell::PANEL_RADIUS);
      panel.show(ui, |ui| {
        ui.set_min_size(ui.available_size());
        egui::Panel::top("page-header").exact_size(shell::HEADER_HEIGHT).resizable(false).frame(egui::Frame::NONE).show(ui, |ui| {
          header_action = shell::page_header(ui, self.page, toggles);
        });
        egui::CentralPanel::default().frame(egui::Frame::NONE).show(ui, |ui| {
          let mut env = env!(self, ctx);
          match self.page {
            Page::Home => {
              if let Some(page) = other::home(ui, env.signed_in, env.requests) {
                self.page = page;
              }
            },
            Page::CreateImage => self.image.ui(ui, &mut env),
            Page::CreateVideo => self.video.ui(ui, &mut env),
            Page::Library => other::library(ui, &mut env, &mut self.library),
            page => other::coming_soon(ui, page),
          }
        });
      });
    });
    if let Some(action) = header_action {
      self.apply_shell_action(action);
    }
    self.prefetch_list_prompts();
  }

  /// The list view shows prompt texts: fetch the records for the visible feed, a few at a time.
  fn prefetch_list_prompts(&mut self) {
    if self.view_mode != ViewMode::List {
      return;
    }
    let feed = match self.page {
      Page::CreateImage => &self.image.feed,
      Page::CreateVideo => &self.video.feed,
      Page::Library => &self.library,
      _ => return,
    };
    let wanted: Vec<String> = feed.items.iter().filter_map(|i| i.prompt_token.clone()).filter(|t| !self.requested_prompts.contains(t)).take(PROMPT_FETCHES_PER_FRAME).collect();
    for token in wanted {
      self.request_prompt(Some(token));
    }
  }

  fn overlays(&mut self, ctx: &egui::Context) {
    if let Some(lb) = &mut self.lightbox {
      let feed = match lb.kind {
        _ if self.page == Page::Library => &self.library,
        MediaKind::Image => &self.image.feed,
        MediaKind::Video => &self.video.feed,
      };
      let order = feed.ordered_tokens();
      let item = self.image.feed.find(&lb.token).or_else(|| self.video.feed.find(&lb.token)).or_else(|| self.library.find(&lb.token)).cloned();
      match item {
        Some(item) => {
          let prompt = item.prompt_token.as_ref().and_then(|t| self.prompt_records.get(t));
          let actions = lb.show(ctx, &item, &order, prompt, &self.catalog, &mut self.cache);
          for action in actions {
            self.lightbox_action(ctx, action, &item);
          }
        },
        None => self.lightbox = None,
      }
    }
    if let Some(picker) = &mut self.picker {
      for action in picker.show(ctx, &mut self.cache) {
        match action {
          PickerAction::Close => self.picker = None,
          PickerAction::LoadMore => {
            if let (Some(p), Some(user)) = (self.picker.as_mut(), self.user.as_ref()) {
              if !p.loading {
                p.loading = true;
                self.backend.load_library("picker".to_owned(), user.username.clone(), p.media_class(), p.next_page);
              }
            }
          },
          PickerAction::Confirm(picks) => {
            if let Some(p) = self.picker.take() {
              let refs = if p.page == MediaKind::Image { &mut self.image.refs } else { &mut self.video.refs };
              common::attach_from_library(refs, p.kind, p.slot, picks);
            }
          },
        }
        if self.picker.is_none() {
          break;
        }
      }
    }
    if let Some(login) = &mut self.login {
      match login.show(ctx) {
        Some(LoginAction::Close) => self.login = None,
        Some(LoginAction::Password) => {
          login.busy = true;
          login.error = None;
          self.backend.login_with_password(login.username.trim().to_owned(), std::mem::take(&mut login.password));
        },
        Some(LoginAction::Browser) => {
          login.error = None;
          self.backend.login_with_browser();
        },
        Some(LoginAction::CancelBrowser) => {
          self.backend.cancel_browser_login();
          login.device = None;
        },
        None => {},
      }
    }
    if let Some(modal) = &mut self.characters_modal {
      let pending: Vec<String> = self.pending_characters.iter().map(|(_, n)| n.clone()).collect();
      for action in modal.show(ctx, &self.characters, &pending, &mut self.cache) {
        match action {
          CharactersAction::Close => self.characters_modal = None,
          CharactersAction::Select { token, name } => {
            self.video.mention_character(&name, &token);
            self.characters_modal = None;
          },
          CharactersAction::Upload { ref_id, path } => self.backend.upload_file(ref_id, RefKind::Image, path),
          CharactersAction::Create { image_token, name, description } => self.backend.create_character(image_token, name, description),
          CharactersAction::Edit { token, name, description } => self.backend.edit_character(token, name, description),
          CharactersAction::Delete { token, name } => self.backend.delete_character(token, name),
          CharactersAction::Preview(url) => self.preview = Some(url),
          CharactersAction::Toast(message) => self.toasts.error(message),
        }
        if self.characters_modal.is_none() {
          break;
        }
      }
    }
    if self.settings_open {
      let username = self.user.as_ref().map(|u| u.username.clone());
      match settings_dialog(ctx, &mut self.enter_to_generate, username.as_deref(), self.credits, self.backend.data_root()) {
        Some(SettingsAction::Close) => self.settings_open = false,
        Some(SettingsAction::SignOut) => {
          self.settings_open = false;
          self.backend.logout();
        },
        Some(SettingsAction::SignIn) => {
          self.settings_open = false;
          self.open_login();
        },
        None => {},
      }
    }
    if let Some(url) = self.preview.clone() {
      let close = widgets::modal(ctx, Id::new("preview"), (ctx.content_rect().width() * 0.9).min(1100.0), |ui| {
        let bounds = egui::vec2(ui.available_width(), ctx.content_rect().height() * 0.8);
        match self.cache.get(ctx, &url) {
          crate::backend::media_cache::Lookup::Ready(t) => {
            let size = fit_inside(t.size_vec2(), bounds);
            ui.vertical_centered(|ui| ui.add(egui::Image::new(&t).fit_to_exact_size(size)));
          },
          _ => {
            ui.add_sized(bounds, egui::Spinner::new());
          },
        }
      });
      if close {
        self.preview = None;
      }
    }
  }

  fn lightbox_action(&mut self, ctx: &egui::Context, action: LightboxAction, item: &FeedItem) {
    match action {
      LightboxAction::Close => self.lightbox = None,
      LightboxAction::Navigate(token) => {
        if let Some(next) = self.find_item(&token).cloned() {
          self.request_prompt(next.prompt_token);
        }
        for feed in [&mut self.image.feed, &mut self.video.feed, &mut self.library] {
          if feed.find(&token).is_some() {
            feed.last_viewed = Some(token.clone());
          }
        }
        if let Some(lb) = &mut self.lightbox {
          lb.token = token;
        }
      },
      LightboxAction::Recreate => self.handle_request(ctx, AppRequest::Recreate { kind: item.kind, token: item.token.clone() }),
      LightboxAction::MakeVideo => self.handle_request(ctx, AppRequest::MakeVideo { token: item.token.clone() }),
      LightboxAction::Download => self.download(std::slice::from_ref(&item.token)),
      LightboxAction::Share => self.handle_request(ctx, AppRequest::Share(item.token.clone())),
      LightboxAction::Delete => {
        self.backend.delete_media(item.token.clone());
        self.lightbox = None;
      },
      LightboxAction::CopyPrompt(text) => self.handle_request(ctx, AppRequest::CopyText(text)),
      LightboxAction::Play(url) => {
        if let Err(err) = open::that(&url) {
          self.toasts.error(format!("Couldn't open the video: {err}"));
        }
      },
    }
  }
}

impl eframe::App for ArtcraftApp {
  fn logic(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
    for event in self.backend.drain() {
      self.handle_event(ctx, event);
    }
    self.timers(ctx);
  }

  fn ui(&mut self, ui: &mut Ui, _frame: &mut eframe::Frame) {
    let ctx = ui.ctx().clone();
    self.cache.poll(&ctx);
    if let Some(err) = self.audio.poll() {
      self.toasts.error(err);
    }
    let playing = [&self.video.refs, &self.image.refs].iter().flat_map(|r| r.audios.iter()).map(|r| r.id).find(|id| self.audio.is_playing(&format!("ref:{id}")));
    crate::prompt_box::deck::set_playing_audio(&ctx, playing);
    self.shell(ui);
    self.page_ui(ui);
    for request in std::mem::take(&mut self.requests) {
      self.handle_request(&ctx, request);
    }
    self.overlays(&ctx);
    self.toasts.show(&ctx);
    window::window_edges(&ctx);
    if let Some(shot) = &mut self.screenshot {
      shot.tick(&ctx);
    }
  }

  fn save(&mut self, storage: &mut dyn eframe::Storage) {
    let saved = Saved { page: self.page, enter_to_generate: self.enter_to_generate, view_mode: self.view_mode, autoplay: self.autoplay, sidebar_open: self.sidebar_open, image: self.image.settings.clone(), video: self.video.settings.clone() };
    eframe::set_value(storage, STORAGE_KEY, &saved);
  }

  fn clear_color(&self, _visuals: &egui::Visuals) -> [f32; 4] {
    theme::CHROME.to_normalized_gamma_f32()
  }
}

/// Diagnostics: `ARTCRAFT_SCREENSHOT=<file.png>` saves a screenshot once the window has settled
/// (and `ARTCRAFT_SCREENSHOT_EXIT=1` then closes the app), for checking the UI headlessly.
struct ScreenshotRequest {
  path: std::path::PathBuf,
  exit: bool,
  frames: u32,
  requested: bool,
}

impl ScreenshotRequest {
  /// Frames to wait before capturing (models, session and thumbnails get a moment to load).
  const SETTLE_SECS: f64 = 8.0;

  fn from_env() -> Option<Self> {
    let path = std::env::var_os("ARTCRAFT_SCREENSHOT")?.into();
    Some(Self { path, exit: std::env::var_os("ARTCRAFT_SCREENSHOT_EXIT").is_some(), frames: 0, requested: false })
  }

  fn tick(&mut self, ctx: &egui::Context) {
    self.frames += 1;
    ctx.request_repaint();
    if !self.requested && ctx.input(|i| i.time) >= Self::SETTLE_SECS {
      self.requested = true;
      ctx.send_viewport_cmd(egui::ViewportCommand::Screenshot(egui::UserData::default()));
    }
    let image = ctx.input(|i| {
      i.raw.events.iter().find_map(|e| match e {
        egui::Event::Screenshot { image, .. } => Some(image.clone()),
        _ => None,
      })
    });
    if let Some(image) = image {
      let [w, h] = image.size;
      let pixels: Vec<u8> = image.pixels.iter().flat_map(|c| c.to_array()).collect();
      match image::RgbaImage::from_raw(w as u32, h as u32, pixels).map(|img| img.save(&self.path)) {
        Some(Ok(())) => log::info!("Saved a screenshot to {}", self.path.display()),
        other => log::error!("Couldn't save the screenshot: {other:?}"),
      }
      if self.exit {
        ctx.send_viewport_cmd(egui::ViewportCommand::Close);
      }
    }
  }
}

/// `artcraft_<token>.<ext>`, the extension taken from the URL.
fn file_name_for(item: &FeedItem) -> String {
  let ext = item.full_url.rsplit('.').next().filter(|e| e.len() <= 4 && e.chars().all(|c| c.is_ascii_alphanumeric())).unwrap_or(if item.kind == MediaKind::Video { "mp4" } else { "png" });
  format!("artcraft_{}.{ext}", item.token)
}
