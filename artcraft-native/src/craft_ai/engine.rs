//! The bridge to a model runtime on this machine. Craft AI never runs a model itself — it talks
//! to the one the user already has (or installs one of the well-known ones and talks to that),
//! which is what keeps it light: no inference engine, no weights, no GPU code inside any
//! ArtCraft app, just a loopback conversation with the family's shared runtime. The same
//! running runtime serves every app on the machine.
//!
//! Three runtimes are probed, each on its own loopback port:
//!
//! * **Ollama** (11434) — the family's primary: its registry holds Gemma 4, its API pulls a
//!   model with streaming progress, and one pull serves every app on the machine, because
//!   Ollama's store is the machine's own.
//! * **LM Studio** (1234) and **llama.cpp's server** (8080) — the OpenAI-compatible pair; both
//!   speak `/v1`, so one client covers them.
//!
//! Every request is `http://127.0.0.1` with a short dial timeout: a runtime that is not running
//! refuses the connection at once, and a port nothing listens on costs the page one failed
//! dial, not a hang. No request ever leaves the machine, and the code holds no address a cloud
//! service could be reached at. The one download that goes further — a model file saved into
//! the shared folder — lives in [`super::hub`], from the model's own store, and carries no
//! account, key or telemetry with it.

use std::io::{BufRead, BufReader};
use std::time::Duration;

use serde_json::{Value, json};

/// Which API a runtime speaks.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum RuntimeKind {
  /// Ollama's own API (`/api/…`), with the pull that downloads a model.
  Ollama,
  /// The OpenAI-compatible `/v1` API of LM Studio and llama.cpp's server.
  OpenAi,
}

/// A model runtime found on this machine.
#[derive(Clone, Copy)]
pub struct Runtime {
  /// Which API it speaks.
  pub kind: RuntimeKind,
  /// The product's name, as the picker shows it.
  pub name: &'static str,
  /// The loopback port it answers on.
  pub port: u16,
}

impl std::fmt::Display for Runtime {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{} · 127.0.0.1:{}", self.name, self.port)
  }
}

/// One turn of a conversation, as the runtimes take them.
#[derive(Clone)]
pub struct ChatMessage {
  /// Who said it: "user", "assistant" or "system".
  pub role: &'static str,
  /// What they said.
  pub content: String,
}

/// Probe the three ports a runtime lives on; the ones that answer join the picker.
pub fn detect() -> Vec<Runtime> {
  let candidates = [
    Runtime { kind: RuntimeKind::Ollama, name: "Ollama", port: 11434 },
    Runtime { kind: RuntimeKind::OpenAi, name: "LM Studio", port: 1234 },
    Runtime { kind: RuntimeKind::OpenAi, name: "llama.cpp", port: 8080 },
  ];
  let agent = probe_agent();
  candidates.into_iter().filter(|rt| alive(&agent, *rt)).collect()
}

/// The models a runtime already has, by the names it knows them by.
pub fn installed(rt: Runtime) -> Result<Vec<String>, String> {
  let agent = probe_agent();
  let value = match rt.kind {
    RuntimeKind::Ollama => get_json(&agent, &url(rt, "/api/tags"))?,
    RuntimeKind::OpenAi => get_json(&agent, &url(rt, "/v1/models"))?,
  };
  let field = match rt.kind {
    RuntimeKind::Ollama => "name",
    RuntimeKind::OpenAi => "id",
  };
  let list = match rt.kind {
    RuntimeKind::Ollama => value["models"].as_array(),
    RuntimeKind::OpenAi => value["data"].as_array(),
  };
  let mut names: Vec<String> = list.into_iter().flatten().filter_map(|m| m[field].as_str().map(String::from)).collect();
  names.sort();
  Ok(names)
}

/// Ask the model a question: the app's specialist system prompt, the turns so far, the new one.
/// A long answer can take its time on CPU, so this is the one request without a read cap.
pub fn chat(rt: Runtime, model: &str, system: &str, history: &[ChatMessage], prompt: &str) -> Result<String, String> {
  let messages = conversation(system, history, prompt);
  let agent = ureq::AgentBuilder::new().timeout_connect(Duration::from_millis(600)).build();
  let value = match rt.kind {
    RuntimeKind::Ollama => {
      let reply = agent
        .post(&url(rt, "/api/chat"))
        .send_json(json!({"model": model, "messages": messages, "stream": false}))
        .map_err(|e| dead(rt, e))?;
      reply.into_json::<Value>().map_err(|e| broken(rt, e))?
    }
    RuntimeKind::OpenAi => {
      let reply = agent
        .post(&url(rt, "/v1/chat/completions"))
        .send_json(json!({"model": model, "messages": messages, "stream": false}))
        .map_err(|e| dead(rt, e))?;
      reply.into_json::<Value>().map_err(|e| broken(rt, e))?
    }
  };
  let answer = match rt.kind {
    RuntimeKind::Ollama => value["message"]["content"].as_str(),
    RuntimeKind::OpenAi => value["choices"][0]["message"]["content"].as_str(),
  };
  answer.map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).ok_or_else(|| format!("{rt} answered, but with no text"))
}

/// A pull's progress, as the page shows it: the runtime's status line, and the bytes done of
/// the total when it streams them.
pub type Progress<'a> = dyn FnMut(&str, Option<(u64, u64)>) + 'a;

/// Have Ollama pull a model, reporting its progress lines (`pulling manifest`, `downloading`,
/// `verifying sha256 digest`, `writing manifest`, `success`) with the bytes when it streams
/// them. The pull lands in Ollama's own store, which every app on the machine shares.
pub fn pull(rt: Runtime, tag: &str, progress: &mut Progress<'_>) -> Result<(), String> {
  let agent = ureq::AgentBuilder::new().timeout_connect(Duration::from_millis(600)).build();
  let reply = agent.post(&url(rt, "/api/pull")).send_json(json!({"name": tag})).map_err(|e| dead(rt, e))?;
  let mut done = false;
  for line in BufReader::new(reply.into_reader()).lines() {
    let line = line.map_err(|e| broken(rt, e))?;
    let Ok(value) = serde_json::from_str::<Value>(&line) else { continue };
    let status = value["status"].as_str().unwrap_or("");
    let bytes = match (value["total"].as_u64(), value["completed"].as_u64()) {
      (Some(total), Some(completed)) => Some((completed, total)),
      _ => None,
    };
    progress(status, bytes);
    done |= status == "success";
  }
  if done { Ok(()) } else { Err(format!("{rt} stopped before the pull of {tag} finished")) }
}

/// The conversation as the runtimes take it: the system prompt, the turns, the new question.
pub fn conversation(system: &str, history: &[ChatMessage], prompt: &str) -> Vec<Value> {
  let mut messages = vec![json!({"role": "system", "content": system})];
  for m in history {
    messages.push(json!({"role": m.role, "content": m.content}));
  }
  messages.push(json!({"role": "user", "content": prompt}));
  messages
}

/// An agent for the short probes — dial fast, read fast.
fn probe_agent() -> ureq::Agent {
  ureq::AgentBuilder::new().timeout_connect(Duration::from_millis(600)).timeout(Duration::from_secs(10)).build()
}

/// A runtime answers on its port.
fn alive(agent: &ureq::Agent, rt: Runtime) -> bool {
  let probe = match rt.kind {
    RuntimeKind::Ollama => agent.get(&url(rt, "/api/version")).call(),
    RuntimeKind::OpenAi => agent.get(&url(rt, "/v1/models")).call(),
  };
  probe.is_ok_and(|r| r.status() == 200)
}

/// A `GET` that must answer JSON.
fn get_json(agent: &ureq::Agent, url: &str) -> Result<Value, String> {
  agent.get(url).call().map_err(|e| dead_str(url, e))?.into_json().map_err(|e| broken_str(url, e))
}

/// A runtime's URL for a path — loopback only, always.
fn url(rt: Runtime, path: &str) -> String {
  format!("http://127.0.0.1:{}{}", rt.port, path)
}

/// A request the runtime refused or answered badly, as the page's error line shows it.
fn dead(rt: Runtime, e: ureq::Error) -> String {
  format!("{rt}: {e}")
}

fn dead_str(url: &str, e: ureq::Error) -> String {
  format!("{url}: {e}")
}

fn broken(rt: Runtime, e: std::io::Error) -> String {
  format!("{rt}: {e}")
}

fn broken_str(url: &str, e: std::io::Error) -> String {
  format!("{url}: {e}")
}
