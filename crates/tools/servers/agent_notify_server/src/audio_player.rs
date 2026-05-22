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
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};

const STOP_POLL_INTERVAL: Duration = Duration::from_millis(50);

#[derive(Clone)]
pub struct AudioPlayerHandle {
  tx: Sender<AudioCommand>,
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
}

#[derive(Clone, Debug)]
pub struct LoopSpec {
  /// Ordered pool of sounds: primary first, then extras. The supervisor
  /// indexes this with `layer % pool.len()`, so when extras run out it
  /// cycles back through the pool (doubling already-playing voices).
  pub pool: Vec<PathBuf>,
  /// Gap (millis) between consecutive plays at each escalation stage:
  /// [initial, after wait_1, after wait_2, after wait_3]. All iterators in
  /// the session share the current stage's value, so existing voices also
  /// speed up when the supervisor moves to a faster stage.
  pub gap_millis_schedule: [u64; 4],
  /// Wall-clock seconds from loop start when layers 2, 3, 4 should join.
  pub escalate_waits_secs: [u64; 3],
}

pub fn spawn_audio_player() -> (AudioPlayerHandle, JoinHandle<()>) {
  let (tx, rx) = mpsc::channel::<AudioCommand>();
  let thread = thread::Builder::new()
    .name("agent-notify-audio".to_string())
    .spawn(move || run_audio_engine(rx))
    .expect("spawn audio engine thread");
  (AudioPlayerHandle { tx }, thread)
}

enum AudioCommand {
  PlayOnce(PathBuf),
  PlayLoop(LoopSpec),
  StopAll,
  Shutdown,
}

fn run_audio_engine(rx: Receiver<AudioCommand>) {
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
        stop_current_loop(&mut current_loop);
        if spec.pool.is_empty() {
          log::warn!("play_loop: empty sound pool, ignoring");
          continue;
        }
        current_loop = Some(start_loop_supervisor(&stream_handle, spec));
      }
      AudioCommand::StopAll => {
        stop_current_loop(&mut current_loop);
        oneshot_sink.clear();
        oneshot_sink.play();
      }
      AudioCommand::Shutdown => {
        stop_current_loop(&mut current_loop);
        oneshot_sink.stop();
        return;
      }
    }
  }

  stop_current_loop(&mut current_loop);
  oneshot_sink.stop();
}

fn start_loop_supervisor(stream_handle: &OutputStreamHandle, spec: LoopSpec) -> LoopController {
  let stop = Arc::new(AtomicBool::new(false));
  let stop_for_thread = stop.clone();
  let stream_handle = stream_handle.clone();
  let thread = thread::Builder::new()
    .name("agent-notify-loop-supervisor".to_string())
    .spawn(move || run_loop_supervisor(stream_handle, spec, stop_for_thread))
    .expect("spawn loop supervisor thread");
  LoopController { stop, thread: Some(thread) }
}

fn stop_current_loop(current_loop: &mut Option<LoopController>) {
  if let Some(mut lc) = current_loop.take() {
    lc.stop.store(true, Ordering::SeqCst);
    if let Some(thread) = lc.thread.take() {
      if let Err(e) = thread.join() {
        log::warn!("audio loop supervisor panicked while shutting down: {:?}", e);
      }
    }
  }
}

fn run_loop_supervisor(
  stream_handle: OutputStreamHandle,
  spec: LoopSpec,
  stop: Arc<AtomicBool>,
) {
  let pool_len = spec.pool.len();
  if pool_len == 0 {
    return;
  }

  let schedule = spec.gap_millis_schedule;
  let gap_millis = Arc::new(AtomicU64::new(schedule[0]));

  let mut iterators: Vec<JoinHandle<()>> = Vec::with_capacity(4);
  iterators.push(spawn_iterator(
    &stream_handle,
    spec.pool[0].clone(),
    gap_millis.clone(),
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

  for layer in 0..3usize {
    if !sleep_with_stop(Duration::from_secs(intervals[layer]), &stop) {
      break;
    }
    let next_gap = schedule[layer + 1];
    if gap_millis.swap(next_gap, Ordering::Relaxed) != next_gap {
      log::info!("escalation stage {}: gap now {}ms", layer + 1, next_gap);
    }
    let pool_idx = (layer + 1) % pool_len;
    iterators.push(spawn_iterator(
      &stream_handle,
      spec.pool[pool_idx].clone(),
      gap_millis.clone(),
      stop.clone(),
      layer + 1,
    ));
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
  stop: Arc<AtomicBool>,
  layer: usize,
) -> JoinHandle<()> {
  log::info!("loop voice {} starting: {}", layer + 1, path.display());
  let stream_handle = stream_handle.clone();
  thread::Builder::new()
    .name(format!("agent-notify-loop-{}", layer + 1))
    .spawn(move || run_loop_iterator(stream_handle, path, gap_millis, stop))
    .expect("spawn loop iterator thread")
}

fn run_loop_iterator(
  stream_handle: OutputStreamHandle,
  path: PathBuf,
  gap_millis: Arc<AtomicU64>,
  stop: Arc<AtomicBool>,
) {
  let sink = match Sink::try_new(&stream_handle) {
    Ok(s) => s,
    Err(e) => {
      log::warn!("loop iterator: failed to create sink: {}", e);
      return;
    }
  };

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
    if gap > 0 && !sleep_with_stop(Duration::from_millis(gap), &stop) {
      return;
    }
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
