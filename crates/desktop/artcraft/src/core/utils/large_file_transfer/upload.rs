//! Implemented from https://github.com/huggingface/hf_transfer/blob/main/src/lib.rs

use crate::core::utils::large_file_transfer::error::Error;
use crate::core::utils::large_file_transfer::util::{exponential_backoff, BASE_WAIT_TIME, MAX_WAIT_TIME};
use futures::stream::FuturesUnordered;
use futures::StreamExt;
use reqwest::header::CONTENT_LENGTH;
use std::collections::HashMap;
use std::io::SeekFrom;
use std::sync::Arc;
use std::time::Duration;
use tokio::fs::OpenOptions;
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tokio::sync::Semaphore;
use tokio::time::sleep;
use tokio_util::codec::{BytesCodec, FramedRead};

/// parts_urls: Dictionary consisting of part numbers as keys and the associated url as values
/// completion_url: The url that should be called when the upload is finished
/// max_files: Number of open file handles, which determines the maximum number of parallel uploads
/// parallel_failures:  Number of maximum failures of different chunks in parallel (cannot exceed max_files)
/// max_retries: Number of maximum attempts per chunk. (Retries are exponentially backed off + jitter)
///
/// The number of threads can be tuned by the environment variable `TOKIO_WORKER_THREADS` as documented in
/// https://docs.rs/tokio/latest/tokio/runtime/struct.Builder.html#method.worker_threads
///
/// See https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html for more information
/// on the multipart upload
#[allow(clippy::too_many_arguments)]
fn multipart_upload(
  file_path: String,
  parts_urls: Vec<String>,
  chunk_size: u64,
  max_files: usize,
  parallel_failures: usize,
  max_retries: usize,
) -> Result<Vec<HashMap<String, String>>, Error> {
  if parallel_failures > max_files {
    return Err(Error::new_err(
      "Error parallel_failures cannot be > max_files".to_string(),
    ));
  }
  if (parallel_failures == 0) != (max_retries == 0) {
    return Err(Error::new_err(
      "For retry mechanism you need to set both `parallel_failures` and `max_retries`"
        .to_string(),
    ));
  }

  tokio::runtime::Builder::new_multi_thread()
    .enable_all()
    .build()?
    .block_on(async {
      upload_async(
        file_path,
        parts_urls,
        chunk_size,
        max_files,
        parallel_failures,
        max_retries,
      )
        .await
    })
}



#[allow(clippy::too_many_arguments)]
async fn upload_async(
  file_path: String,
  parts_urls: Vec<String>,
  chunk_size: u64,
  max_files: usize,
  parallel_failures: usize,
  max_retries: usize,
) -> Result<Vec<HashMap<String, String>>, Error> {
  let client = reqwest::Client::new();

  let mut handles = FuturesUnordered::new();
  let semaphore = Arc::new(Semaphore::new(max_files));
  let parallel_failures_semaphore = Arc::new(Semaphore::new(parallel_failures));

  for (part_number, part_url) in parts_urls.iter().enumerate() {
    let url = part_url.to_string();
    let path = file_path.to_owned();
    let client = client.clone();

    let start = (part_number as u64) * chunk_size;
    let semaphore = semaphore.clone();
    let parallel_failures_semaphore = parallel_failures_semaphore.clone();
    handles.push(tokio::spawn(async move {
      let permit = semaphore
        .clone()
        .acquire_owned()
        .await
        .map_err(|err| Error::new_err(format!("Error acquiring semaphore: {err}")))?;
      let mut chunk = upload_chunk(&client, &url, &path, start, chunk_size).await;
      let mut i = 0;
      if parallel_failures > 0 {
        while let Err(ul_err) = chunk {
          if i >= max_retries {
            return Err(Error::new_err(format!(
              "Failed after too many retries ({max_retries}): {ul_err}"
            )));
          }

          let parallel_failure_permit = parallel_failures_semaphore.clone().try_acquire_owned().map_err(|err| {
            Error::new_err(format!(
              "Failed too many failures in parallel ({parallel_failures}): {ul_err} ({err})"
            ))
          })?;

          let wait_time = exponential_backoff(BASE_WAIT_TIME, i, MAX_WAIT_TIME);
          sleep(Duration::from_millis(wait_time as u64)).await;

          chunk = upload_chunk(&client, &url, &path, start, chunk_size).await;
          i += 1;
          drop(parallel_failure_permit);
        }
      }
      drop(permit);
      chunk.map_err(|e|{
        //match e {
        //  Error::Io(io) => Error::new_err(format!("Io error {io}")),
        //  Error::Request(req) => Error::new_err(format!("Error while sending chunk {req}")),
        //  Error::ToStrError(req) => Error::new_err(format!("Response header contains non ASCII chars: {req}")),
        //}
        e
      }).map(|chunk| (part_number, chunk, chunk_size))
    }));
  }

  let mut results: Vec<HashMap<String, String>> = vec![HashMap::default(); parts_urls.len()];

  while let Some(result) = handles.next().await {
    match result {
      Ok(Ok((part_number, headers, size))) => {
        //if let Some(ref callback) = callback {
        //  callback.call((size,), None)?;
        //}
        results[part_number] = headers;
      }
      Ok(Err(py_err)) => {
        return Err(py_err);
      }
      Err(err) => {
        return Err(Error::new_err(format!(
          "Error occurred while uploading: {err}"
        )));
      }
    }
  }

  Ok(results)
}

async fn upload_chunk(
  client: &reqwest::Client,
  url: &str,
  path: &str,
  start: u64,
  chunk_size: u64,
) -> Result<HashMap<String, String>, Error> {
  let mut options = OpenOptions::new();
  let mut file = options.read(true).open(path).await?;
  let file_size = file.metadata().await?.len();
  let bytes_transferred = std::cmp::min(file_size - start, chunk_size);

  file.seek(SeekFrom::Start(start)).await?;
  let chunk = file.take(chunk_size);

  let response = client
    .put(url)
    .header(CONTENT_LENGTH, bytes_transferred)
    .body(reqwest::Body::wrap_stream(FramedRead::new(
      chunk,
      BytesCodec::new(),
    )))
    .send()
    .await?;
  let response = response.error_for_status()?;
  let mut headers = HashMap::new();
  for (name, value) in response.headers().into_iter() {
    headers.insert(name.to_string(), value.to_str()?.to_owned());
  }
  Ok(headers)
}

