//! Background-thread audio engine for the notify server.
//!
//! The engine runs on a dedicated OS thread that owns the cpal `OutputStream`
//! (which is `!Send` on some platforms). All callers — including actix
//! handlers — interact with it through [`AudioPlayerHandle`], which forwards
//! commands over an mpsc channel.
//!
//! The engine maintains two independent mixing channels:
//!
//! - **`oneshot_sink`** — fire-and-forget sounds queued by `play_once`. Reused
//!   for the lifetime of the engine via `clear() + play()` so subsequent
//!   appends keep working after a `StopAll`.
//! - **A per-loop iterator thread** — owns its own `Sink` and replays the
//!   configured sound, sleeping `gap_millis` between iterations. Replaced
//!   atomically when a new loop sound is requested; signalled to stop via
//!   `Arc<AtomicBool>` polled every 50ms (kept short so `/stop` and Ctrl+C
//!   feel instant).
//!
//! Because the two channels share the same `OutputStreamHandle`, a one-shot
//! sound naturally mixes with whatever is looping.

use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
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

  pub fn play_loop(&self, path: PathBuf, gap_millis: u64) {
    let _ = self.tx.send(AudioCommand::PlayLoop(path, gap_millis));
  }

  pub fn stop_all(&self) {
    let _ = self.tx.send(AudioCommand::StopAll);
  }

  pub fn shutdown(&self) {
    let _ = self.tx.send(AudioCommand::Shutdown);
  }
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
  PlayLoop(PathBuf, u64),
  StopAll,
  Shutdown,
}

fn run_audio_engine(rx: Receiver<AudioCommand>) {
  let (_stream, stream_handle) = match OutputStream::try_default() {
    Ok(s) => s,
    Err(e) => {
      log::error!("audio engine: failed to open default output stream: {}", e);
      // Drain the channel so callers don't block, then exit.
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
      AudioCommand::PlayLoop(path, gap_millis) => {
        stop_current_loop(&mut current_loop);
        current_loop = Some(start_loop(&stream_handle, path, gap_millis));
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

  // Channel closed; clean up anyway.
  stop_current_loop(&mut current_loop);
  oneshot_sink.stop();
}

fn start_loop(
  stream_handle: &OutputStreamHandle,
  path: PathBuf,
  gap_millis: u64,
) -> LoopController {
  let stop = Arc::new(AtomicBool::new(false));
  let stop_for_thread = stop.clone();
  let stream_handle = stream_handle.clone();
  let thread = thread::Builder::new()
    .name("agent-notify-loop".to_string())
    .spawn(move || run_loop_iterator(stream_handle, path, gap_millis, stop_for_thread))
    .expect("spawn loop iterator thread");
  LoopController { stop, thread: Some(thread) }
}

fn stop_current_loop(current_loop: &mut Option<LoopController>) {
  if let Some(mut lc) = current_loop.take() {
    lc.stop.store(true, Ordering::SeqCst);
    if let Some(thread) = lc.thread.take() {
      if let Err(e) = thread.join() {
        log::warn!("audio loop thread panicked while shutting down: {:?}", e);
      }
    }
  }
}

fn run_loop_iterator(
  stream_handle: OutputStreamHandle,
  path: PathBuf,
  gap_millis: u64,
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
    match enqueue_sound(&sink, &path) {
      Ok(()) => {}
      Err(e) => {
        log::warn!("loop iterator: failed to enqueue {}: {}", path.display(), e);
        return;
      }
    }

    // Wait for playback to finish, but stay responsive to stop.
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

    if gap_millis > 0 {
      let total = Duration::from_millis(gap_millis);
      let started = Instant::now();
      while started.elapsed() < total {
        if stop.load(Ordering::SeqCst) {
          return;
        }
        let remaining = total.saturating_sub(started.elapsed());
        thread::sleep(remaining.min(STOP_POLL_INTERVAL));
      }
    }
  }
}

fn enqueue_sound(sink: &Sink, path: &Path) -> anyhow::Result<()> {
  let file = BufReader::new(File::open(path)?);
  let source = Decoder::new(file)?;
  sink.append(source);
  Ok(())
}

struct LoopController {
  stop: Arc<AtomicBool>,
  thread: Option<JoinHandle<()>>,
}
