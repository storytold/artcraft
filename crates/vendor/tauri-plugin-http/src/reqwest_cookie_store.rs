// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

// taken from https://github.com/pfernie/reqwest_cookie_store/blob/2ec4afabcd55e24d3afe3f0626ee6dc97bed938d/src/lib.rs

use std::{
    path::PathBuf,
    sync::{mpsc::Receiver, Arc, Mutex},
};

// NB(bt): Re-export these for reuse
pub use cookie_store::{CookieStore, RawCookie, RawCookieParseError};
use reqwest::header::HeaderValue;

fn set_cookies(
    cookie_store: &mut CookieStore,
    cookie_headers: &mut dyn Iterator<Item = &HeaderValue>,
    url: &url::Url,
) {
    let cookies = cookie_headers.filter_map(|val| {
        std::str::from_utf8(val.as_bytes())
            .map_err(RawCookieParseError::from)
            .and_then(RawCookie::parse)
            .map(|c| c.into_owned())
            .ok()
    });
    cookie_store.store_response_cookies(cookies, url);
}

fn cookies(cookie_store: &CookieStore, url: &url::Url) -> Option<HeaderValue> {
    let s = cookie_store
        .get_request_values(url)
        .map(|(name, value)| format!("{}={}", name, value))
        .collect::<Vec<_>>()
        .join("; ");

    if s.is_empty() {
        return None;
    }

    HeaderValue::from_maybe_shared(bytes::Bytes::from(s)).ok()
}

/// A [`cookie_store::CookieStore`] wrapped internally by a [`std::sync::Mutex`], suitable for use in
/// async/concurrent contexts.
#[derive(Debug)]
pub struct CookieStoreMutex {
    pub path: PathBuf,
    // NB(bt): We've made both of these public so we can access them.
    pub store: Arc<Mutex<CookieStore>>,
    save_lock: Arc<tokio::sync::Mutex<()>>,
    pub save_task: Mutex<Option<CancellableTask>>,
}

impl CookieStoreMutex {
    /// Create a new [`CookieStoreMutex`] from an existing [`cookie_store::CookieStore`].
    pub fn new(path: PathBuf, cookie_store: CookieStore) -> CookieStoreMutex {
        CookieStoreMutex {
            path,
            store: Arc::new(Mutex::new(cookie_store)),
            save_lock: Arc::new(tokio::sync::Mutex::new(())),
            save_task: Default::default(),
        }
    }

    pub fn load<R: std::io::BufRead>(
        path: PathBuf,
        reader: R,
    ) -> cookie_store::Result<CookieStoreMutex> {
        cookie_store::serde::load(reader, |c| serde_json::from_str(c))
            .map(|store| CookieStoreMutex::new(path, store))
    }

    /// Persist the current jar and wait until it reaches disk. All writers share
    /// one lock and take their snapshot only when they own it, so an older
    /// queued save cannot overwrite a completed purge with stale cookies.
    pub async fn flush(&self) -> cookie_store::Result<()> {
        persist_current(&self.path, &self.store, &self.save_lock).await
    }

    pub fn request_save(&self) -> cookie_store::Result<Receiver<()>> {
        let (path, store, save_lock) = (self.path.clone(), self.store.clone(), self.save_lock.clone());
        let (tx, rx) = std::sync::mpsc::channel();
        let task = tauri::async_runtime::spawn(async move {
            match persist_current(&path, &store, &save_lock).await {
                Ok(()) => { let _ = tx.send(()); }
                Err(_e) => {
                    #[cfg(feature = "tracing")]
                    tracing::error!("failed to save cookie jar: {_e}");
                }
            }
        });
        self.save_task.lock().unwrap().replace(CancellableTask(task));
        Ok(rx)
    }

}

impl reqwest::cookie::CookieStore for CookieStoreMutex {
    fn set_cookies(&self, cookie_headers: &mut dyn Iterator<Item = &HeaderValue>, url: &url::Url) {
        set_cookies(&mut self.store.lock().unwrap(), cookie_headers, url);

        // try to persist cookies immediately asynchronously
        if let Err(_e) = self.request_save() {
            #[cfg(feature = "tracing")]
            tracing::error!("failed to save cookie jar: {_e}");
        }
    }

    fn cookies(&self, url: &url::Url) -> Option<HeaderValue> {
        let store = self.store.lock().unwrap();
        cookies(&store, url)
    }
}

#[derive(Debug)]
struct CancellableTask(tauri::async_runtime::JoinHandle<()>);

impl Drop for CancellableTask {
    fn drop(&mut self) {
        self.0.abort();
    }
}

async fn persist_current(path: &std::path::Path, store: &Mutex<CookieStore>, save_lock: &tokio::sync::Mutex<()>) -> cookie_store::Result<()> {
    let _save = save_lock.lock().await;
    let text = {
        let jar = store.lock().expect("poisoned cookie jar mutex");
        let cookies: Vec<_> = jar.iter_unexpired().filter(|cookie| cookie.is_persistent()).collect();
        serde_json::to_string(&cookies)?
    };
    // No await between snapshot and write: cancellation of an older save must
    // not release its lock while a detached tokio filesystem write is running.
    std::fs::write(path, text)?;
    Ok(())
}
