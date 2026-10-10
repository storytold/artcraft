//! Drives the prompt box headlessly (egui_kittest): generate gating, Enter-to-generate, the
//! pickers, @-mentions and clear-all.

use egui::accesskit::Role;
use egui_kittest::Harness;
use egui_kittest::kittest::Queryable;

use crate::backend::media_cache::MediaCache;
use crate::models::ModelInfo;
use crate::pages::toolbar;
use crate::prompt_box::deck::DeckLimits;
use crate::prompt_box::editor::{MentionKind, mention_items};
use crate::prompt_box::refs::{RefKind, References};
use crate::prompt_box::{DeckMode, PromptBoxProps, PromptBoxState, show};

struct State {
  // Keeps the media cache's runtime alive.
  _rt: tokio::runtime::Runtime,
  cache: MediaCache,
  prompt: String,
  refs: References,
  box_state: PromptBoxState,
  model: ModelInfo,
  aspect: String,
  enter_to_generate: bool,
  with_mentions: bool,
  actions: Vec<String>,
  /// The harness draws one frame while building: fonts are installed then and used from the next.
  fonts_ready: bool,
}

fn state() -> State {
  let rt = tokio::runtime::Builder::new_current_thread().enable_all().build().expect("runtime");
  let cache = MediaCache::new(rt.handle().clone(), reqwest::Client::new());
  let model = ModelInfo { id: "nano_banana_pro".into(), name: "Nano Banana Pro".into(), aspect_ratios: vec!["square".into(), "wide_sixteen_by_nine".into()], image_refs_max: 4, batch_default: 1, ..Default::default() };
  State { _rt: rt, cache, prompt: String::new(), refs: References::default(), box_state: PromptBoxState::default(), model, aspect: "square".into(), enter_to_generate: false, with_mentions: false, actions: Vec::new(), fonts_ready: false }
}

fn build(state: State) -> Harness<'static, State> {
  let mut harness = Harness::builder().with_size(egui::vec2(1100.0, 600.0)).build_ui_state(
    |ui, s: &mut State| {
      if !s.fonts_ready {
        crate::theme::apply(ui.ctx());
        s.fonts_ready = true;
        return;
      }
      let mentions = if s.with_mentions { mention_items(MentionKind::Image, [None, None].into_iter()) } else { Vec::new() };
      let props = PromptBoxProps { id: egui::Id::new("test-box"), placeholder: "Describe what you want in the image...", enter_to_generate: s.enter_to_generate, mentions: &mentions, max_length: Some(Some(1000)), deck: DeckMode::References(DeckLimits { max_images: 4, max_videos: 0, max_video_secs: None, max_audios: 0, max_audio_secs: None, library: false }), accepts: &[RefKind::Image], credits: Some(15), generate_enabled: !s.prompt.trim().is_empty(), generating: false, generate_tooltip: "Generate", warning: None, banner: None };
      let (model, aspect) = (&s.model, &mut s.aspect);
      let mut left = |ui: &mut egui::Ui| {
        if let Some(v) = toolbar::aspect_ratio(ui, egui::Id::new("test-aspect"), model, aspect) {
          *aspect = v;
        }
      };
      let mut right = |_: &mut egui::Ui| {};
      let actions = show(ui, &mut s.prompt, &s.refs, &mut s.box_state, &props, &mut s.cache, &mut left, &mut right);
      s.actions.extend(actions.iter().map(|a| format!("{a:?}")));
    },
    state,
  );
  harness.run();
  harness
}

fn editor<'h>(harness: &'h Harness<'_, State>) -> egui_kittest::Node<'h> {
  harness.get_by_role(Role::MultilineTextInput)
}

#[test]
fn generate_needs_a_prompt() {
  let mut harness = build(state());
  harness.get_by_label("Generate").click();
  harness.run();
  assert!(harness.state().actions.is_empty(), "disabled without a prompt");

  harness.state_mut().prompt = "a red knight".into();
  harness.run();
  harness.get_by_label("Generate").click();
  harness.run();
  assert_eq!(harness.state().actions, ["Generate"]);
}

#[test]
fn enter_generates_only_when_the_setting_is_on() {
  let mut harness = build(state());
  editor(&harness).focus();
  harness.run();
  editor(&harness).type_text("hello");
  harness.key_press(egui::Key::Enter);
  harness.run();
  assert_eq!(harness.state().prompt, "hello\n");
  assert!(harness.state().actions.is_empty());

  let mut s = state();
  s.enter_to_generate = true;
  let mut harness = build(s);
  editor(&harness).focus();
  harness.run();
  editor(&harness).type_text("hello");
  harness.key_press(egui::Key::Enter);
  harness.run();
  assert_eq!(harness.state().prompt, "hello");
  assert_eq!(harness.state().actions, ["Generate"]);
}

#[test]
fn aspect_ratio_picker_opens_and_picks() {
  let mut harness = build(state());
  harness.get_by_label("Square").click();
  harness.run();
  harness.get_by_label("16:9 (Wide)").click();
  harness.run();
  assert_eq!(harness.state().aspect, "wide_sixteen_by_nine");
  assert!(harness.query_by_label("16:9 (Wide)").is_some(), "the pill now shows the pick");
}

#[test]
fn typing_at_offers_mentions_and_enter_inserts_one() {
  let mut s = state();
  s.with_mentions = true;
  let mut harness = build(s);
  editor(&harness).focus();
  harness.run();
  editor(&harness).type_text("put @Im");
  harness.run();
  assert!(harness.query_by_label("@Image2").is_some(), "dropdown lists the mentions");
  harness.key_press(egui::Key::ArrowDown);
  harness.key_press(egui::Key::Enter);
  harness.run();
  assert_eq!(harness.state().prompt, "put @Image2 ");
  assert!(harness.state().actions.is_empty(), "Enter picked a mention, it didn't generate");
}

#[test]
fn clear_all_empties_the_prompt() {
  let mut s = state();
  s.prompt = "something".into();
  let mut harness = build(s);
  harness.get_by_label("Clear all").click();
  harness.run();
  assert_eq!(harness.state().prompt, "");
  assert_eq!(harness.state().actions, ["ClearAll"]);
}
