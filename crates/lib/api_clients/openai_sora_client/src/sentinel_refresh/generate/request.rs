use crate::sentinel_refresh::generate::config::{get_random_core_count, get_random_document_key, get_random_navigator_key, get_random_window_key};
use chrono::FixedOffset;
use chrono::Utc;
use idempotency::uuid::generate_random_uuid;
use rand::Rng;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use sha3::{Digest, Sha3_512};

// [
// 4000, // first
// "Fri Apr 11 2025 13:28:14 GMT+0530 (India Standard Time)", // second
// None, // third
// 28, // fourth
// "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0", // fifth
// "https://sora-cdn.oaistatic.com/_next/static/chunks/f90f2e60-61da6d33257661c4.js", // sixth
// None, // seventh
// "en-US", // eighth
// "en-US,en", // ninth
// 29, // tenth
// "productSub−20100101", // eleventh
// "location", // twelfth
// "ondrop", // thirteenth
// 10520, // fourteenth - generated from time.perf_counter() * 1000
// "48094014-a024-4d2d-8ec4-ba9c7cfef9c4", // fifteenth
// "", // sixteenth
// 16, // seventeenth - Number of cores
#[derive(Debug, Clone)]
pub struct GenerateSentinelRefreshRequest {
  first: usize,
  second: String, // Date
  third: Option<String>,
  fourth: Option<usize>,
  fifth: String,           // User agent
  sixth: String,           // URL
  seventh: Option<String>, // Language
  eighth: String,          // Accept-Language
  ninth: String,           // Product Sub
  tenth: Option<usize>,
  eleventh: String,   // Product Sub - Navigator key
  twelfth: String,    // Location - Document key
  thirteenth: String, // On Drop - Window key
  fourteenth: usize,  // generated from time.perf_counter() * 1000
  fifteenth: String,  // UUID
  sixteenth: String,  // empty string
  seventeenth: usize, // Number of cores
}

fn generate_date() -> String {
  let now_utc = Utc::now();
  let offset = FixedOffset::west_opt(5 * 60 * 60).unwrap();
  let now_with_offset = Utc::now().with_timezone(&offset);

  let formatted_date = now_with_offset.format("%a %b %d %Y %H:%M:%S GMT-0500 (Eastern Standard Time)");
  return formatted_date.to_string();
}

impl GenerateSentinelRefreshRequest {
  pub fn new() -> Self {
    let first_candidates = vec![1920 + 1080, 2560 + 1440, 1920 + 1200, 2560 + 1600];
    let first = first_candidates[rand::rng().random_range(0..first_candidates.len())];

    let second = generate_date();

    let third = None;

    let fourth = None;

    let fifth = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0".to_string();

    let sixth = "https://sora-cdn.oaistatic.com/_next/static/chunks/f90f2e60-61da6d33257661c4.js".to_string();

    let seventh = None;

    let eighth = "en-US".to_string();

    let ninth = "en-US,en".to_string();

    let tenth = None;

    let eleventh = get_random_navigator_key();

    let twelfth = get_random_document_key();

    let thirteenth = get_random_window_key();

    let fourteenth = 10520;

    let fifteenth = generate_random_uuid();

    let sixteenth = "".to_string();

    let seventeenth = get_random_core_count();
    Self { first, second, third, fourth, fifth, sixth, seventh, eighth, ninth, tenth, eleventh: eleventh.to_string(), twelfth: twelfth.to_string(), thirteenth: thirteenth.to_string(), fourteenth, fifteenth, sixteenth, seventeenth }
  }

  pub fn with_fourth(mut self, fourth: usize) -> Self {
    self.fourth = Some(fourth);
    self
  }

  pub fn with_tenth(mut self, tenth: usize) -> Self {
    self.tenth = Some(tenth);
    self
  }

  //TODO(kasisnu): This is a temporary function to build the request.
  // It is extremely hacky and this whole struct should be rewritten to be more ergonomic.
  pub fn build(self) -> String {
    let mut request = String::new();
    request.push_str("[");
    request.push_str(&self.first.to_string());
    request.push_str(",");
    request.push_str(&string_with_quotes(self.second));
    request.push_str(",");
    request.push_str(&self.third.unwrap_or("null".to_string()));
    request.push_str(",");
    request.push_str(&self.fourth.unwrap_or(0).to_string());
    request.push_str(",");
    request.push_str(&string_with_quotes(self.fifth));
    request.push_str(",");
    request.push_str(&string_with_quotes(self.sixth));
    request.push_str(",");
    request.push_str(&self.seventh.unwrap_or("null".to_string()));
    request.push_str(",");
    request.push_str(&string_with_quotes(self.eighth));
    request.push_str(",");
    request.push_str(&string_with_quotes(self.ninth));
    request.push_str(",");
    request.push_str(&self.tenth.unwrap_or(0).to_string());
    request.push_str(",");
    request.push_str(&string_with_quotes(self.eleventh));
    request.push_str(",");
    request.push_str(&string_with_quotes(self.twelfth));
    request.push_str(",");
    request.push_str(&string_with_quotes(self.thirteenth));
    request.push_str(",");
    request.push_str(&self.fourteenth.to_string());
    request.push_str(",");
    request.push_str(&string_with_quotes(self.fifteenth));
    request.push_str(",");
    request.push_str(&string_with_quotes(self.sixteenth));
    request.push_str(",");
    request.push_str(&self.seventeenth.to_string());
    request.push_str("]");
    request
  }

  pub fn hash_request(seed: f64, request: String) -> Vec<u8> {
    let mut hasher = Sha3_512::new();
    hasher.update(seed.to_string());
    let base64_request = BASE64_STANDARD.encode(request.as_bytes());
    hasher.update(base64_request);
    hasher.finalize().to_vec()
  }

  pub fn with_fourth_and_tenth(mut self) -> (Self, String) {
    let mut fourth = 0;
    let mut tenth = 0;
    let max_iterations = 500000;
    let diff_len = 6;
    let target_bytes = vec![0x0f, 0xff, 0xff];
    let random_seed: f64 = rand::rng().random();

    let mut base64_request = BASE64_STANDARD.encode(self.clone().build().as_bytes());
    for i in 0..max_iterations {
      fourth = i;
      tenth = i >> 1;
      let request = self.clone().with_fourth(fourth).with_tenth(tenth).build();
      let hash_bytes = Self::hash_request(random_seed, request.clone());
      base64_request = BASE64_STANDARD.encode(request.as_bytes());

      let mut is_less_or_equal = true;
      for j in 0..std::cmp::min(diff_len, target_bytes.len()) {
        if j < hash_bytes.len() {
          if hash_bytes[j] > target_bytes[j] {
            is_less_or_equal = false;
            break;
          } else if hash_bytes[j] < target_bytes[j] {
            break;
          }
        }
      }

      if is_less_or_equal {
        break;
      }
    }

    (self.with_fourth(fourth).with_tenth(tenth), format!("gAAAAAC{}", base64_request))
  }
}

fn string_with_quotes(value: String) -> String {
  format!("\"{}\"", value)
}
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_generate_sentinel_refresh_request() {
    let request = GenerateSentinelRefreshRequest::new();
    println!("{}", request.build());
  }

  #[test]
  fn test_with_fourth_and_tenth() {
    let request = GenerateSentinelRefreshRequest::new().with_fourth(100).with_tenth(200);
    println!("{}", request.build());
  }

  #[test]
  fn test_hash_request() {
    let request = GenerateSentinelRefreshRequest::new().with_fourth(100).with_tenth(200);
    let hash = GenerateSentinelRefreshRequest::hash_request(0.1, request.build());
    println!("{}", hash.iter().map(|b| format!("{:02x}", b)).collect::<String>());
  }

  #[test]
  fn test_with_fourth_and_tenth_2() {
    let (request, base64_request) = GenerateSentinelRefreshRequest::new().with_fourth_and_tenth();
    println!("{}", base64_request);
  }
}
