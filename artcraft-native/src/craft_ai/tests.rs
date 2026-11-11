//! The page's own tests: the catalogue's figures, the shared folder's bookkeeping, the
//! runtime's addresses and the prompts' framing. Nothing here touches the network or the
//! machine's real shared folder — detection and downloads are of the live app.

use super::engine::{self, Runtime, RuntimeKind};
use super::hub;
use super::models::{self, MODELS};
use super::tasks;

/// The family is the family: five models, lightest first, no id repeated.
#[test]
fn catalogue_is_five_models_lightest_first() {
  assert_eq!(MODELS.len(), 5, "the catalogue holds the five Gemma 4 models");
  for pair in MODELS.windows(2) {
    assert!(pair[0].bytes < pair[1].bytes, "lightest first: {} before {}", pair[0].id, pair[1].id);
  }
  for (i, a) in MODELS.iter().enumerate() {
    for b in &MODELS[i + 1..] {
      assert_ne!(a.id, b.id, "ids are unique");
      assert_ne!(a.file, b.file, "files are unique");
      assert_ne!(a.ollama, b.ollama, "ollama tags are unique");
    }
  }
}

/// Every figure a card shows is stated, and every place a download goes is where the model
/// lives: the file lands on `huggingface.co`, pulled over `https`.
#[test]
fn catalogue_figures_and_addresses_are_stated() {
  for m in MODELS {
    assert!(!m.name.is_empty() && m.name.starts_with("Gemma 4"), "{}: named", m.id);
    assert!(!m.params.is_empty() && m.context.ends_with("context"), "{}: params and context", m.id);
    assert_eq!(m.inputs, "Text + image", "{}: Gemma 4 is multimodal", m.id);
    assert!(!m.best.is_empty(), "{}: says what it is best at", m.id);
    assert!(m.ram_gb * 1_000_000_000 >= m.bytes, "{}: RAM need covers the file", m.id);
    assert!(m.ollama.starts_with("gemma4:"), "{}: an Ollama tag", m.id);
    assert!(m.repo.starts_with("unsloth/gemma-4"), "{}: an ungated mirror", m.id);
    assert!(m.file.ends_with(".gguf"), "{}: a GGUF file", m.id);
    assert_eq!(m.url(), format!("https://huggingface.co/{}/resolve/main/{}", m.repo, m.file));
    assert!(matches!(models::by_file(m.file), Some(back) if back.id == m.id), "{}: found back by file", m.id);
    assert!(matches!(models::by_ollama(m.ollama), Some(back) if back.id == m.id), "{}: found back by tag", m.id);
  }
  assert!(models::by_file("nothing.gguf").is_none());
  assert!(models::by_ollama("llama3:8b").is_none());
}

/// The cards' sizes: one decimal, in GB.
#[test]
fn gb_is_one_decimal() {
  assert_eq!(models::gb(0), "0.0 GB");
  assert_eq!(models::gb(3_106_738_272), "3.1 GB");
  assert_eq!(models::gb(16_947_541_728), "16.9 GB");
  assert_eq!(MODELS[0].gb(), "3.1 GB");
}

/// Every task is a dictionary key pair, and the prompts frame the input for this app.
#[test]
fn tasks_frame_the_app() {
  assert_eq!(tasks::APP, "artcraft");
  assert!(!tasks::TASKS.is_empty());
  for t in tasks::TASKS {
    assert!(!t.label.is_empty() && !t.hint.is_empty(), "a task shows a label and a hint");
  }
  let system = tasks::system_prompt();
  assert!(system.contains("ArtCraft"), "the model is told which app it is in");
  assert!(system.contains("Arabic"), "the model answers in the user's language, Arabic included");
  assert!(system.contains("Never invent"), "the model is told to admit what it does not know");

  let framed = tasks::user_prompt(1, "a neon koi over a night city");
  assert!(framed.contains("neon koi"), "the input rides along");
  assert!(framed.contains("ArtCraft"), "the framing names the craft");
  // "Ask anything" passes the input through untouched.
  assert_eq!(tasks::user_prompt(0, "hello"), "hello");
  // Out-of-range indices land on the last task, not a panic.
  let last = tasks::user_prompt(usize::MAX, "hello");
  assert!(last.contains("hello"), "the input rides along on the last task too");
}

/// The runtimes the page knows: three ports, loopback only, the OpenAI pair on `/v1`.
#[test]
fn runtime_addresses_are_loopback() {
  let ollama = Runtime { kind: RuntimeKind::Ollama, name: "Ollama", port: 11434 };
  let lm = Runtime { kind: RuntimeKind::OpenAi, name: "LM Studio", port: 1234 };
  let llama = Runtime { kind: RuntimeKind::OpenAi, name: "llama.cpp", port: 8080 };
  for rt in [ollama, lm, llama] {
    assert!(rt.to_string().contains("127.0.0.1"), "{rt}: the picker shows a loopback address");
  }
  assert_ne!(ollama.kind, lm.kind, "Ollama speaks its own API");
  assert_eq!(lm.kind, llama.kind, "LM Studio and llama.cpp share /v1");
}

/// The conversation the runtimes take: system first, the history, the new question last.
#[test]
fn conversation_shape() {
  use super::engine::ChatMessage;
  let history = vec![
    ChatMessage { role: "user", content: "what is a reference?".into() },
    ChatMessage { role: "assistant", content: "an image, video or audio clip attached to a prompt".into() },
  ];
  let messages = engine::conversation("be brief", &history, "and a style?");
  assert_eq!(messages.len(), 4);
  assert_eq!(messages[0]["role"], "system");
  assert_eq!(messages[0]["content"], "be brief");
  assert_eq!(messages[1]["role"], "user");
  assert_eq!(messages[2]["role"], "assistant");
  assert_eq!(messages[3]["content"], "and a style?");
}

/// The sidecar's bookkeeping: a note written beside a file reads back the app that put it
/// there — in a scratch folder, never the machine's own shared one.
#[test]
fn sidecar_round_trip() {
  let mut dir = std::env::temp_dir();
  dir.push(format!("craft-ai-test-{}", std::process::id()));
  std::fs::create_dir_all(&dir).unwrap();
  let spec = &MODELS[0];
  hub::write_note(&dir, spec, "artcraft").unwrap();
  assert_eq!(hub::downloaded_by(&dir, spec).as_deref(), Some("artcraft"));
  let _ = std::fs::remove_dir_all(&dir);
}

/// The shared folder is where the platform keeps app data, under the family's name — the same
/// place in every app, which is the point.
#[test]
fn models_dir_is_the_family_place() {
  let Some(dir) = hub::models_dir() else { return };
  let shown = dir.display().to_string();
  assert!(shown.contains("ArtCraft") && shown.contains("Craft AI"), "{shown}: under the family's name");
  assert!(dir.ends_with("models"), "{shown}: the models folder itself");
}
