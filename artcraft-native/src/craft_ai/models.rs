//! The Gemma 4 catalogue, as the page offers it: one family, five models, every figure on the
//! card taken from the model's own store — the file's exact bytes from its Hugging Face page,
//! the RAM need from the running model's own footprint, the context window as Google states it.
//!
//! Gemma 4 is Apache-2.0, multimodal (text and image in) and multilingual, and the family runs
//! from E2B — the one the lightest machine carries — up to 31B, the deepest of them; the 26B is
//! a Mixture-of-Experts that activates about 4B of its 26B per token, so it answers near the
//! big models at a fraction of the compute. Every model here is the 4-bit quantisation the
//! Google team trains for local use (QAT), the flavour DeepMind ships for on-device running.
//!
//! The catalogue is static on purpose: a model release is an event, its figures are facts, and
//! a catalogue that shifted under the user would make the fit hints untrustworthy. When Google
//! ships a new Gemma, it earns its row by a change here.
//!
//! [`device`] reads this machine's own figures — RAM installed, space free where the shared
//! folder lives — each platform with its own tool (`/proc` on Linux, `sysctl` on macOS, `wmic`
//! on Windows). A figure that cannot be read stays `None`, and the page treats `None` as "not
//! known", never as zero: no fit hint is drawn on a guess.

use std::path::Path;

/// One model of the catalogue.
pub struct ModelSpec {
  /// The catalogue id, stable across the ArtCraft family (the shared folder names its
  /// sidecars after it).
  pub id: &'static str,
  /// The model's own name, as the card's heading shows it.
  pub name: &'static str,
  /// The parameter count, as the family tells it.
  pub params: &'static str,
  /// The context window, as the card shows it.
  pub context: &'static str,
  /// What the model accepts as input.
  pub inputs: &'static str,
  /// What the card says the model is best at (a dictionary key).
  pub best: &'static str,
  /// The RAM a machine should have for the model and its context, in GB.
  pub ram_gb: u64,
  /// The exact size of the downloadable file, in bytes.
  pub bytes: u64,
  /// The model's tag in Ollama's registry.
  pub ollama: &'static str,
  /// The ungated repository the file downloads from, on Hugging Face.
  pub repo: &'static str,
  /// The file's name in the shared folder.
  pub file: &'static str,
}

/// The Gemma 4 catalogue, lightest first.
pub const MODELS: &[ModelSpec] = &[
  ModelSpec {
    id: "gemma4-e2b",
    name: "Gemma 4 E2B",
    params: "2B effective",
    context: "128K context",
    inputs: "Text + image",
    best: "Best for: everyday help on the lightest machines",
    ram_gb: 4,
    bytes: 3_106_738_272,
    ollama: "gemma4:e2b",
    repo: "unsloth/gemma-4-e2b-it-GGUF",
    file: "gemma-4-E2B-it-Q4_K_M.gguf",
  },
  ModelSpec {
    id: "gemma4-e4b",
    name: "Gemma 4 E4B",
    params: "4B effective",
    context: "128K context",
    inputs: "Text + image",
    best: "Best for: a step up in quality, still light",
    ram_gb: 6,
    bytes: 4_977_171_584,
    ollama: "gemma4:e4b",
    repo: "unsloth/gemma-4-e4b-it-GGUF",
    file: "gemma-4-E4B-it-Q4_K_M.gguf",
  },
  ModelSpec {
    id: "gemma4-12b",
    name: "Gemma 4 12B",
    params: "12B dense",
    context: "256K context",
    inputs: "Text + image",
    best: "Best for: balanced everyday and technical work",
    ram_gb: 9,
    bytes: 7_121_861_440,
    ollama: "gemma4:12b",
    repo: "unsloth/gemma-4-12b-it-GGUF",
    file: "gemma-4-12b-it-Q4_K_M.gguf",
  },
  ModelSpec {
    id: "gemma4-26b-a4b",
    name: "Gemma 4 26B A4B",
    params: "26B total · 4B active",
    context: "256K context",
    inputs: "Text + image",
    best: "Best for: near-flagship answers at MoE speed",
    ram_gb: 20,
    bytes: 16_947_541_728,
    ollama: "gemma4:26b",
    repo: "unsloth/gemma-4-26b-a4b-it-GGUF",
    file: "gemma-4-26B-A4B-it-UD-Q4_K_M.gguf",
  },
  ModelSpec {
    id: "gemma4-31b",
    name: "Gemma 4 31B",
    params: "31B dense",
    context: "256K context",
    inputs: "Text + image",
    best: "Best for: the deepest reasoning this family has",
    ram_gb: 22,
    bytes: 18_323_733_440,
    ollama: "gemma4:31b",
    repo: "unsloth/gemma-4-31b-it-GGUF",
    file: "gemma-4-31B-it-Q4_K_M.gguf",
  },
];

/// The model a shared-folder file belongs to, by its file name.
#[cfg(test)]
pub fn by_file(file: &str) -> Option<&'static ModelSpec> {
  MODELS.iter().find(|m| m.file == file)
}

/// The model an Ollama tag refers to, when it is one of ours.
#[cfg(test)]
pub fn by_ollama(tag: &str) -> Option<&'static ModelSpec> {
  MODELS.iter().find(|m| m.ollama == tag)
}

/// A byte count as the cards show it ("3.1 GB", "16.9 GB").
pub fn gb(bytes: u64) -> String {
  format!("{:.1} GB", bytes as f64 / 1e9)
}

impl ModelSpec {
  /// The file's size, as the card shows it.
  pub fn gb(&self) -> String {
    gb(self.bytes)
  }

  /// Where the file downloads from, in full.
  pub fn url(&self) -> String {
    format!("https://huggingface.co/{}/resolve/main/{}", self.repo, self.file)
  }
}

/// This machine's figures, for the fit hints beside each model.
pub struct Device {
  /// RAM installed, in GB, when it could be read.
  pub ram_gb: Option<u64>,
  /// Space free where the shared folder lives (or will live), in GB, when it could be read.
  pub free_gb: Option<u64>,
}

/// Read the machine's RAM and the space free at `dir`. Each figure is asked for on its own and
/// may come back `None` — the page draws no hint on a figure it does not have.
pub fn device(dir: Option<&Path>) -> Device {
  Device { ram_gb: total_ram_gb(), free_gb: dir.and_then(free_gb) }
}

/// The RAM this machine has, in whole GB.
fn total_ram_gb() -> Option<u64> {
  let bytes = if cfg!(target_os = "linux") {
    linux_meminfo()?.checked_mul(1024)
  } else if cfg!(target_os = "macos") {
    macos_memsize()
  } else if cfg!(target_os = "windows") {
    windows_ram()
  } else {
    None
  }?;
  Some((bytes + (1 << 30) - 1) >> 30)
}

/// `MemTotal`, from `/proc/meminfo`, in kB — present on Linux and in every WSL distribution.
fn linux_meminfo() -> Option<u64> {
  let text = std::fs::read_to_string("/proc/meminfo").ok()?;
  let line = text.lines().find(|l| l.starts_with("MemTotal:"))?;
  line.split_whitespace().nth(1)?.parse().ok()
}

/// `hw.memsize`, in bytes, over `sysctl`.
fn macos_memsize() -> Option<u64> {
  let out = std::process::Command::new("sysctl").arg("-n").arg("hw.memsize").output().ok()?;
  String::from_utf8_lossy(&out.stdout).trim().parse().ok()
}

/// `TotalPhysicalMemory`, in bytes, from `wmic` — the PowerShell `Get-CimInstance` as the
/// fallback for the Windows builds that ship without `wmic`.
fn windows_ram() -> Option<u64> {
  let wmic = std::process::Command::new("wmic").args(["ComputerSystem", "get", "TotalPhysicalMemory", "/value"]).output().ok()?;
  if let Some(n) = wmic_number(&wmic, "TotalPhysicalMemory") {
    return Some(n);
  }
  let out = std::process::Command::new("powershell")
    .args(["-NoProfile", "-Command", "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory"])
    .output()
    .ok()?;
  String::from_utf8_lossy(&out.stdout).trim().parse().ok()
}

/// One `Name=value` number of `wmic … /value` output.
fn wmic_number(out: &std::process::Output, name: &str) -> Option<u64> {
  value_line(&String::from_utf8_lossy(&out.stdout), name)?.parse().ok()
}

/// One `Name=value` line of `wmic … /value` output, the value of `name`.
fn value_line<'a>(text: &'a str, name: &str) -> Option<&'a str> {
  let prefix = format!("{name}=");
  let line = text.lines().find(|l| l.starts_with(&prefix))?;
  Some(line[prefix.len()..].trim())
}

/// The space free on the volume `dir` sits on, in whole GB — `df` on the Unix side, `wmic` on
/// Windows (the PowerShell `Get-PSDrive` as its fallback).
fn free_gb(dir: &Path) -> Option<u64> {
  let bytes = if cfg!(target_os = "windows") {
    windows_free(dir)?
  } else {
    let out = std::process::Command::new("df").arg("-k").arg(dir).output().ok()?;
    let text = String::from_utf8_lossy(&out.stdout);
    let line = text.lines().nth(1)?;
    let avail_kb: u64 = line.split_whitespace().nth(3)?.parse().ok()?;
    avail_kb.checked_mul(1024)?
  };
  Some((bytes + (1 << 30) - 1) >> 30)
}

/// `FreeSpace` of the drive a Windows path sits on, in bytes: `wmic logicaldisk where
/// "DeviceID='C:'" get FreeSpace /value`, or `(Get-PSDrive C).Free`.
fn windows_free(dir: &Path) -> Option<u64> {
  let path = dir.to_str()?;
  let drive = path.split(['\\', '/']).next()?.to_uppercase();
  let mut letters = drive.chars();
  let letter = letters.next()?;
  if !letter.is_ascii_uppercase() || letters.next().is_some() {
    return None; // a UNC path (\\server\share) has no drive to ask about
  }
  let wmic = std::process::Command::new("wmic")
    .args(["logicaldisk", "where", &format!("DeviceID='{drive}:'"), "get", "FreeSpace", "/value"])
    .output()
    .ok()?;
  if let Some(n) = wmic_number(&wmic, "FreeSpace") {
    return Some(n);
  }
  let out = std::process::Command::new("powershell").args(["-NoProfile", "-Command", &format!("(Get-PSDrive {drive}).Free")]).output().ok()?;
  String::from_utf8_lossy(&out.stdout).trim().parse().ok()
}
