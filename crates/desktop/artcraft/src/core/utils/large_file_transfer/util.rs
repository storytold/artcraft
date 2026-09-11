//! Implemented from https://github.com/huggingface/hf_transfer/blob/main/src/lib.rs

use rand::{thread_rng, Rng};

pub const BASE_WAIT_TIME: usize = 300;
pub const MAX_WAIT_TIME: usize = 10_000;

fn jitter() -> usize {
  thread_rng().gen_range(0..=500)
}

pub fn exponential_backoff(base_wait_time: usize, n: usize, max: usize) -> usize {
  (base_wait_time + n.pow(2) + jitter()).min(max)
}
