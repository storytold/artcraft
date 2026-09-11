//! Implemented from https://github.com/huggingface/hf_transfer/blob/main/src/lib.rs

use crate::core::utils::large_file_transfer::error::Error;
use crate::core::utils::large_file_transfer::util::{exponential_backoff, BASE_WAIT_TIME, MAX_WAIT_TIME};
use futures::stream::FuturesUnordered;
use futures::StreamExt;
use log::info;
use reqwest::header::{
  HeaderMap, HeaderName, HeaderValue, AUTHORIZATION, CONTENT_RANGE,
  RANGE,
};
use reqwest::Url;
use std::collections::HashMap;
use std::io::SeekFrom;
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::time::Duration;
use tempfile::NamedTempFile;
use tokio::fs::OpenOptions;
use tokio::io::AsyncSeekExt;
use tokio::io::AsyncWriteExt;
use tokio::sync::Semaphore;
use tokio::time::sleep;

pub struct ProgressUpdate {
  pub complete: usize,
  pub total_length: usize,
}

/// max_files: Number of open file handles, which determines the maximum number of parallel downloads
/// parallel_failures:  Number of maximum failures of different chunks in parallel (cannot exceed max_files)
/// max_retries: Number of maximum attempts per chunk. (Retries are exponentially backed off + jitter)
///
/// The number of threads can be tuned by the environment variable `TOKIO_WORKER_THREADS` as documented in
/// https://docs.rs/tokio/latest/tokio/runtime/struct.Builder.html#method.worker_threads
#[allow(clippy::too_many_arguments)]
pub async fn download_async<P: AsRef<Path>>(
  url: String,
  filename: NamedTempFile,
  final_filename: P,
  max_files: usize,
  chunk_size: usize,
  parallel_failures: usize,
  max_retries: usize,
  input_headers: Option<HashMap<String, String>>,
  maybe_progress_sender: Option<Sender<ProgressUpdate>>,
) -> Result<(), Error> {
  info!(">>> Downloading: {}", filename.as_ref().display());

  let client = reqwest::Client::builder()
    // https://github.com/hyperium/hyper/issues/2136#issuecomment-589488526
    .http2_keep_alive_timeout(Duration::from_secs(15))
    .build()?;

  let mut headers = HeaderMap::new();
  let mut auth_token = None;
  if let Some(input_headers) = input_headers {
    headers.reserve(input_headers.len());
    for (k, v) in input_headers {
      let name: HeaderName = k
        .try_into()
        .map_err(|err| Error::new_err(format!("Invalid header: {err}")))?;
      let value: HeaderValue = AsRef::<str>::as_ref(&v)
        .try_into()
        .map_err(|err| Error::new_err(format!("Invalid header value: {err}")))?;
      if name == AUTHORIZATION {
        auth_token = Some(value);
      } else {
        headers.insert(name, value);
      }
    }
  };

  let response = if let Some(token) = auth_token.as_ref() {
    client.get(&url).header(AUTHORIZATION, token)
  } else {
    client.get(&url)
  }
    .headers(headers.clone())
    .header(RANGE, "bytes=0-0")
    .send()
    .await
    .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?
    .error_for_status()
    .map_err(|err| Error::new_err(err.to_string()))?;

  // Only call the final redirect URL to avoid overloading the Hub with requests and also
  // altering the download count
  let redirected_url = response.url();
  if Url::parse(&url)
    .map_err(|err| Error::new_err(format!("failed to parse url: {err}")))?
    .host()
    == redirected_url.host()
  {
    if let Some(token) = auth_token {
      headers.insert(AUTHORIZATION, token);
    }
  }

  let content_range = response
    .headers()
    .get(CONTENT_RANGE)
    .ok_or(Error::new_err("No content length".to_string()))?
    .to_str()
    .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?;

  let size: Vec<&str> = content_range.split('/').collect();
  // Content-Range: bytes 0-0/702517648
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
  let length: usize = size
    .last()
    .ok_or(Error::new_err(
      "Error while downloading: No size was detected".to_string(),
    ))?
    .parse()
    .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?;


  info!("File {:?} is {:?} length", filename.as_ref(), length);

  let mut handles = FuturesUnordered::new();
  let semaphore = Arc::new(Semaphore::new(max_files));
  let parallel_failures_semaphore = Arc::new(Semaphore::new(parallel_failures));
  let max_chunk_complete = Arc::new(AtomicUsize::new(0));

  for start in (0..length).step_by(chunk_size) {
    let url = redirected_url.to_string();
    let filename = filename.as_ref().to_owned();
    let client = client.clone();
    let headers = headers.clone();

    let stop = std::cmp::min(start + chunk_size - 1, length);
    let semaphore = semaphore.clone();
    let parallel_failures_semaphore = parallel_failures_semaphore.clone();
    let maybe_progress = maybe_progress_sender.clone();
    let max_chunk_complete = max_chunk_complete.clone();
    handles.push(tokio::spawn(async move {
      let permit = semaphore
        .acquire_owned()
        .await
        .map_err(|err| Error::new_err(format!("Error while downloading: {err}")))?;
      let mut chunk = download_chunk(&client, &url, &filename, start, stop, headers.clone()).await;
      let mut i = 0;
      if parallel_failures > 0 {
        while let Err(dlerr) = chunk {
          if i >= max_retries {
            return Err(Error::new_err(format!(
              "Failed after too many retries ({max_retries}): {dlerr}"
            )));
          }
          let parallel_failure_permit = parallel_failures_semaphore.clone().try_acquire_owned().map_err(|err| {
            Error::new_err(format!(
              "Failed too many failures in parallel ({parallel_failures}): {dlerr} ({err})"
            ))
          })?;

          let wait_time = exponential_backoff(BASE_WAIT_TIME, i, MAX_WAIT_TIME);
          sleep(Duration::from_millis(wait_time as u64)).await;

          chunk = download_chunk(&client, &url, &filename, start, stop, headers.clone()).await;
          i += 1;
          drop(parallel_failure_permit);
          
          if let Some(sender) = maybe_progress.as_ref() {
            // NB: Calling fetch_max twice. First call will return the lower value.
            let _old = max_chunk_complete.fetch_max(stop, Ordering::SeqCst);
            let max_chunk = max_chunk_complete.fetch_max(stop, Ordering::SeqCst);
            let progress_update = ProgressUpdate { 
              complete: max_chunk,
              total_length: length,
            };
            if let Err(_err) = sender.send(progress_update) {
              // Fail silently, not essential to issue progress updates
            }
          }
        }
      }
      drop(permit);
      chunk.map_err(|e| Error::new_err(format!("Downloading error {e}"))).and(Ok(stop - start))
    }));
  }

  // Output the chained result
  while let Some(result) = handles.next().await {
    match result {
      Ok(Ok(size)) => {
        //if let Some(ref callback) = callback {
        //  callback.call((size,), None)?;
        //}
      }
      Ok(Err(py_err)) => {
        return Err(py_err);
      }
      Err(err) => {
        return Err(Error::new_err(format!(
          "Error while downloading: {err}"
        )));
      }
    }
  }

  let file = filename.persist(final_filename)
    .map_err(|e| Error::new_err(format!("Could not rename to final filename: {:?}", e)))?;

  file.sync_all()?;

  Ok(())
}

async fn download_chunk<P: AsRef<Path>>(
  client: &reqwest::Client,
  url: &str,
  filename: P,
  start: usize,
  stop: usize,
  headers: HeaderMap,
) -> Result<(), Error> {
  // Process each socket concurrently.
  let range = format!("bytes={start}-{stop}");
  let mut file = OpenOptions::new()
    .write(true)
    .truncate(false)
    .create(true)
    .open(filename)
    .await?;
  file.seek(SeekFrom::Start(start as u64)).await?;
  let response = client
    .get(url)
    .headers(headers)
    .header(RANGE, range)
    .send()
    .await?
    .error_for_status()?;
  let content = response.bytes().await?;
  file.write_all(&content).await?;
  Ok(())
}
