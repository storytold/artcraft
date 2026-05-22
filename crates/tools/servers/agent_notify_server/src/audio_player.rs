//! Background-thread audio engine for the notify server.
//!
//! The engine runs on a dedicated OS thread that owns the cpal `OutputStream`
//! (which is `!Send` on some platforms). All callers — including actix
//! handlers — interact with it through [`AudioPlayerHandle`], which forwards
//! commands over an mpsc channel.
//!
//! The engine maintains two kinds of mixing channels at the cpal output:
//!
//! - **`oneshot_sink`** — fire-and-forget sounds queued by `play_once`. Reused
//!   for the lifetime of the engine via `clear() + play()` so subsequent
//!   appends keep working after a `StopAll`.
//! - **A loop session** — a supervisor thread that escalates over time. It
//!   starts one looping iterator immediately, then adds a second, third, and
//!   fourth concurrent iterator at the configured escalation times. Each
//!   iterator owns its own `Sink` and runs in its own thread, so the voices
//!   drift naturally relative to one another. Replacing the loop session
//!   (`PlayLoop` while one is running) or `StopAll` signals every iterator
//!   and the supervisor via a shared `Arc<AtomicBool>` polled every 50ms.
//!
//! Because every channel shares the same `OutputStreamHandle`, one-shots
//! mix on top of however many loop voices are currently running.

use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use rand::Rng;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};
use serde_derive::Serialize;

const STOP_POLL_INTERVAL: Duration = Duration::from_millis(50);

#[derive(Clone)]
pub struct AudioPlayerHandle {
  tx: Sender<AudioCommand>,
  status: Arc<Mutex<InternalStatus>>,
}

impl AudioPlayerHandle {
  pub fn play_once(&self, path: PathBuf) {
    let _ = self.tx.send(AudioCommand::PlayOnce(path));
  }

  pub fn play_loop(&self, spec: LoopSpec) {
    let _ = self.tx.send(AudioCommand::PlayLoop(spec));
  }

  pub fn stop_all(&self) {
    let _ = self.tx.send(AudioCommand::StopAll);
  }

  pub fn shutdown(&self) {
    let _ = self.tx.send(AudioCommand::Shutdown);
  }

  /// Snapshot of the engine state for the `/state` endpoint. Read-only —
  /// does not change playback.
  pub fn status(&self) -> EngineStatus {
    let s = self.status.lock().unwrap_or_else(|e| e.into_inner());
    EngineStatus {
      loop_playing: s.loop_playing,
      loop_name: s.loop_name.clone(),
      voices_active: s.voices_active,
      current_stage: s.current_stage,
      current_gap_millis: s.current_gap_millis,
      current_jitter_millis: s.current_jitter_millis,
      loop_pool_size: s.loop_pool_size,
      loop_uptime_secs: s.loop_started.map(|t| t.elapsed().as_secs()),
    }
  }
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct EngineStatus {
  pub loop_playing: bool,
  pub loop_name: Option<String>,
  pub voices_active: u32,
  pub current_stage: u32,
  pub current_gap_millis: u64,
  pub current_jitter_millis: u64,
  pub loop_pool_size: u32,
  pub loop_uptime_secs: Option<u64>,
}

#[derive(Default)]
struct InternalStatus {
  loop_playing: bool,
  loop_name: Option<String>,
  voices_active: u32,
  current_stage: u32,
  current_gap_millis: u64,
  current_jitter_millis: u64,
  loop_pool_size: u32,
  loop_started: Option<Instant>,
}

impl InternalStatus {
  fn reset_loop(&mut self) {
    self.loop_playing = false;
    self.loop_name = None;
    self.voices_active = 0;
    self.current_stage = 0;
    self.current_gap_millis = 0;
    self.current_jitter_millis = 0;
    self.loop_pool_size = 0;
    self.loop_started = None;
  }
}

#[derive(Clone, Debug)]
pub struct LoopSpec {
  /// Short tag identifying which endpoint started this loop ("beep" /
  /// "done" / "await"). Surfaced in `/state` so callers can see what's
  /// playing.
  pub name: String,
  /// Ordered pool of sounds: primary first, then extras. The supervisor
  /// indexes this with `layer % pool.len()`, so when extras run out it
  /// cycles back through the pool (doubling already-playing voices).
  pub pool: Vec<PathBuf>,
  /// Gap (millis) between consecutive plays at each escalation stage:
  /// [initial, after wait_1, after wait_2, after wait_3]. All iterators in
  /// the session share the current stage's value, so existing voices also
  /// speed up when the supervisor moves to a faster stage.
  pub gap_millis_schedule: [u64; 4],
  /// Max +/- jitter (millis) at each escalation stage. Same shape and
  /// sharing semantics as `gap_millis_schedule`.
  pub jitter_millis_schedule: [u64; 4],
  /// Wall-clock seconds from loop start when layers 2, 3, 4 should join.
  pub escalate_waits_secs: [u64; 3],
}

pub fn spawn_audio_player() -> (AudioPlayerHandle, JoinHandle<()>) {
  let (tx, rx) = mpsc::channel::<AudioCommand>();
  let status = Arc::new(Mutex::new(InternalStatus::default()));
  let status_for_engine = status.clone();
  let thread = thread::Builder::new()
    .name("agent-notify-audio".to_string())
    .spawn(move || run_audio_engine(rx, status_for_engine))
    .expect("spawn audio engine thread");
  (AudioPlayerHandle { tx, status }, thread)
}

enum AudioCommand {
  PlayOnce(PathBuf),
  PlayLoop(LoopSpec),
  StopAll,
  Shutdown,
}

fn run_audio_engine(rx: Receiver<AudioCommand>, status: Arc<Mutex<InternalStatus>>) {
  let (_stream, stream_handle) = match OutputStream::try_default() {
    Ok(s) => s,
    Err(e) => {
      log::error!("audio engine: failed to open default output stream: {}", e);
      while rx.recv().is_ok() {}
      return;
    }
  };

  let oneshot_sink = match Sink::try_new(&stream_handle) {
    Ok(s) => s,
    Err(e) => {
      log::error!("audio engine: failed to create oneshot sink: {}", e);
      while rx.recv().is_ok() {}
      return;
    }
  };

  let mut current_loop: Option<LoopController> = None;

  while let Ok(cmd) = rx.recv() {
    match cmd {
      AudioCommand::PlayOnce(path) => {
        if let Err(e) = enqueue_sound(&oneshot_sink, &path) {
          log::warn!("play_once {}: {}", path.display(), e);
        }
      }
      AudioCommand::PlayLoop(spec) => {
        stop_current_loop(&mut current_loop, &status);
        if spec.pool.is_empty() {
          log::warn!("play_loop: empty sound pool, ignoring");
          continue;
        }
        current_loop = Some(start_loop_supervisor(&stream_handle, spec, status.clone()));
      }
      AudioCommand::StopAll => {
        stop_current_loop(&mut current_loop, &status);
        oneshot_sink.clear();
        oneshot_sink.play();
      }
      AudioCommand::Shutdown => {
        stop_current_loop(&mut current_loop, &status);
        oneshot_sink.stop();
        return;
      }
    }
  }

  stop_current_loop(&mut current_loop, &status);
  oneshot_sink.stop();
}

fn start_loop_supervisor(
  stream_handle: &OutputStreamHandle,
  spec: LoopSpec,
  status: Arc<Mutex<InternalStatus>>,
) -> LoopController {
  // Initialize the visible status before any iterator starts, so a /state
  // query racing the spawn sees the new loop, not the previous one's tail.
  {
    let mut s = status.lock().unwrap_or_else(|e| e.into_inner());
    s.loop_playing = true;
    s.loop_name = Some(spec.name.clone());
    s.voices_active = 1;
    s.current_stage = 0;
    s.current_gap_millis = spec.gap_millis_schedule[0];
    s.current_jitter_millis = spec.jitter_millis_schedule[0];
    s.loop_pool_size = spec.pool.len() as u32;
    s.loop_started = Some(Instant::now());
  }

  let stop = Arc::new(AtomicBool::new(false));
  let stop_for_thread = stop.clone();
  let stream_handle = stream_handle.clone();
  let thread = thread::Builder::new()
    .name("agent-notify-loop-supervisor".to_string())
    .spawn(move || run_loop_supervisor(stream_handle, spec, stop_for_thread, status))
    .expect("spawn loop supervisor thread");
  LoopController { stop, thread: Some(thread) }
}

fn stop_current_loop(
  current_loop: &mut Option<LoopController>,
  status: &Arc<Mutex<InternalStatus>>,
) {
  if let Some(mut lc) = current_loop.take() {
    lc.stop.store(true, Ordering::SeqCst);
    if let Some(thread) = lc.thread.take() {
      if let Err(e) = thread.join() {
        log::warn!("audio loop supervisor panicked while shutting down: {:?}", e);
      }
    }
  }
  let mut s = status.lock().unwrap_or_else(|e| e.into_inner());
  s.reset_loop();
}

fn run_loop_supervisor(
  stream_handle: OutputStreamHandle,
  spec: LoopSpec,
  stop: Arc<AtomicBool>,
  status: Arc<Mutex<InternalStatus>>,
) {
  let pool_len = spec.pool.len();
  if pool_len == 0 {
    return;
  }

  let gap_schedule = spec.gap_millis_schedule;
  let jitter_schedule = spec.jitter_millis_schedule;
  let gap_millis = Arc::new(AtomicU64::new(gap_schedule[0]));
  let jitter_millis = Arc::new(AtomicU64::new(jitter_schedule[0]));

  let mut iterators: Vec<JoinHandle<()>> = Vec::with_capacity(4);
  iterators.push(spawn_iterator(
    &stream_handle,
    spec.pool[0].clone(),
    gap_millis.clone(),
    jitter_millis.clone(),
    stop.clone(),
    0,
  ));

  // Convert absolute escalation times into deltas relative to the previous
  // escalation. `saturating_sub` handles out-of-order config (e.g. wait_2
  // smaller than wait_1) by collapsing the interval to zero.
  let waits = spec.escalate_waits_secs;
  let intervals = [
    waits[0],
    waits[1].saturating_sub(waits[0]),
    waits[2].saturating_sub(waits[1]),
  ];

  let mut rng = rand::rng();

  for layer in 0..3usize {
    // Jitter the spawn phase by the *upcoming* stage's jitter, so voices
    // 2/3/4 don't all land exactly on `escalate_wait_N`.
    let nominal_interval_ms = intervals[layer].saturating_mul(1000);
    let phase_jitter_ms = jitter_schedule[layer + 1];
    let interval_ms = jittered_gap_millis(nominal_interval_ms, phase_jitter_ms, &mut rng);
    if !sleep_with_stop(Duration::from_millis(interval_ms), &stop) {
      break;
    }
    let next_gap = gap_schedule[layer + 1];
    let next_jitter = jitter_schedule[layer + 1];
    let prev_gap = gap_millis.swap(next_gap, Ordering::Relaxed);
    let prev_jitter = jitter_millis.swap(next_jitter, Ordering::Relaxed);
    if prev_gap != next_gap || prev_jitter != next_jitter {
      log::info!(
        "escalation stage {}: gap now {}ms +/- {}ms",
        layer + 1,
        next_gap,
        next_jitter
      );
    }
    let pool_idx = (layer + 1) % pool_len;
    iterators.push(spawn_iterator(
      &stream_handle,
      spec.pool[pool_idx].clone(),
      gap_millis.clone(),
      jitter_millis.clone(),
      stop.clone(),
      layer + 1,
    ));
    let mut s = status.lock().unwrap_or_else(|e| e.into_inner());
    s.voices_active = iterators.len() as u32;
    s.current_stage = (layer + 1) as u32;
    s.current_gap_millis = next_gap;
    s.current_jitter_millis = next_jitter;
  }

  // Wait until something signals stop, then drain iterator threads.
  while !stop.load(Ordering::SeqCst) {
    thread::sleep(STOP_POLL_INTERVAL);
  }

  for t in iterators {
    if let Err(e) = t.join() {
      log::warn!("audio loop iterator panicked: {:?}", e);
    }
  }
}

fn spawn_iterator(
  stream_handle: &OutputStreamHandle,
  path: PathBuf,
  gap_millis: Arc<AtomicU64>,
  jitter_millis: Arc<AtomicU64>,
  stop: Arc<AtomicBool>,
  layer: usize,
) -> JoinHandle<()> {
  log::info!("loop voice {} starting: {}", layer + 1, path.display());
  let stream_handle = stream_handle.clone();
  thread::Builder::new()
    .name(format!("agent-notify-loop-{}", layer + 1))
    .spawn(move || {
      run_loop_iterator(stream_handle, path, gap_millis, jitter_millis, stop)
    })
    .expect("spawn loop iterator thread")
}

fn run_loop_iterator(
  stream_handle: OutputStreamHandle,
  path: PathBuf,
  gap_millis: Arc<AtomicU64>,
  jitter_millis: Arc<AtomicU64>,
  stop: Arc<AtomicBool>,
) {
  let sink = match Sink::try_new(&stream_handle) {
    Ok(s) => s,
    Err(e) => {
      log::warn!("loop iterator: failed to create sink: {}", e);
      return;
    }
  };

  let mut rng = rand::rng();

  while !stop.load(Ordering::SeqCst) {
    if let Err(e) = enqueue_sound(&sink, &path) {
      log::warn!("loop iterator: failed to enqueue {}: {}", path.display(), e);
      return;
    }

    while !sink.empty() {
      if stop.load(Ordering::SeqCst) {
        sink.stop();
        return;
      }
      thread::sleep(STOP_POLL_INTERVAL);
    }

    if stop.load(Ordering::SeqCst) {
      return;
    }

    let gap = gap_millis.load(Ordering::Relaxed);
    let jitter = jitter_millis.load(Ordering::Relaxed);
    let sleep_ms = jittered_gap_millis(gap, jitter, &mut rng);
    log::debug!(
      "loop iterator sleeping {}ms (gap={}, jitter=±{})",
      sleep_ms,
      gap,
      jitter
    );
    if sleep_ms > 0
      && !sleep_with_stop(Duration::from_millis(sleep_ms), &stop)
    {
      return;
    }
  }
}

/// Apply a uniformly random offset in `[-jitter, +jitter]` to `gap`. A fresh
/// random value is drawn on every call, so each iteration of each voice gets
/// its own jitter — voices never re-align. The lower bound saturates at 0
/// so the result can't wrap below zero.
fn jittered_gap_millis<R: Rng>(gap: u64, jitter: u64, rng: &mut R) -> u64 {
  if jitter == 0 {
    return gap;
  }
  // Cap at i64::MAX/2 so the negation below can't overflow. In practice
  // jitter values are at most a few seconds; the cap is just paranoia.
  let span = (jitter.min(i64::MAX as u64 / 2)) as i64;
  let delta = rng.random_range(-span..=span);
  if delta >= 0 {
    gap.saturating_add(delta as u64)
  } else {
    gap.saturating_sub(delta.unsigned_abs())
  }
}

fn enqueue_sound(sink: &Sink, path: &Path) -> anyhow::Result<()> {
  let file = BufReader::new(File::open(path)?);
  let source = Decoder::new(file)?;
  sink.append(source);
  Ok(())
}

/// Sleep for `total` while polling `stop` every [`STOP_POLL_INTERVAL`].
/// Returns `true` if the full duration elapsed, `false` if `stop` was set.
fn sleep_with_stop(total: Duration, stop: &AtomicBool) -> bool {
  let started = Instant::now();
  while started.elapsed() < total {
    if stop.load(Ordering::SeqCst) {
      return false;
    }
    let remaining = total.saturating_sub(started.elapsed());
    thread::sleep(remaining.min(STOP_POLL_INTERVAL));
  }
  !stop.load(Ordering::SeqCst)
}

struct LoopController {
  stop: Arc<AtomicBool>,
  thread: Option<JoinHandle<()>>,
}

#[cfg(test)]
mod tests {
  use super::*;

  mod jittered_gap_millis_tests {
    use super::*;

    #[test]
    fn zero_jitter_returns_gap_unchanged() {
      let mut rng = rand::rng();
      for _ in 0..50 {
        assert_eq!(jittered_gap_millis(500, 0, &mut rng), 500);
      }
    }

    #[test]
    fn nonzero_jitter_stays_within_bounds_and_varies() {
      let mut rng = rand::rng();
      let mut seen_below = false;
      let mut seen_above = false;
      for _ in 0..500 {
        let v = jittered_gap_millis(1000, 200, &mut rng);
        assert!(v >= 800 && v <= 1200, "out of bounds: {}", v);
        if v < 1000 { seen_below = true; }
        if v > 1000 { seen_above = true; }
      }
      assert!(seen_below && seen_above, "expected jitter on both sides");
    }

    #[test]
    fn negative_jitter_is_clamped_to_zero() {
      let mut rng = rand::rng();
      for _ in 0..200 {
        let v = jittered_gap_millis(50, 1000, &mut rng);
        assert!(v <= 1050);
        // saturating_sub at the floor — never wraps below 0.
      }
    }

    #[test]
    fn rerolls_per_call_so_consecutive_values_differ() {
      // With jitter=1000 there are 2001 possible outcomes; a sample of 50
      // is overwhelmingly unlikely to be all-equal under uniform random.
      let mut rng = rand::rng();
      let samples: std::collections::HashSet<u64> = (0..50)
        .map(|_| jittered_gap_millis(5_000, 1_000, &mut rng))
        .collect();
      assert!(samples.len() > 10, "expected >10 distinct values, got {}", samples.len());
    }
  }
}
