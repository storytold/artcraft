// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

//! Access the HTTP client written in Rust.

pub use reqwest;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use error::{Error, Result};

// NB(bt): We're making everything public so we can access it.
pub mod commands;
pub mod error;
#[cfg(feature = "cookies")]
pub mod reqwest_cookie_store;
pub mod scope;

#[cfg(feature = "cookies")]
const COOKIES_FILENAME: &str = ".cookies";

// NB(bt): We've vendored in this library so we can poke at the cookie data store.
pub struct Http {
    #[cfg(feature = "cookies")]
    pub cookies_jar: std::sync::Arc<crate::reqwest_cookie_store::CookieStoreMutex>,
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("http")
        .setup(|app, _| {
            #[cfg(feature = "cookies")]
            let cookies_jar = {
                use crate::reqwest_cookie_store::*;
                use std::fs::File;
                use std::io::BufReader;

                let cache_dir = app.path().app_cache_dir()?;
                std::fs::create_dir_all(&cache_dir)?;

                let path = cache_dir.join(COOKIES_FILENAME);
                
                // NB(bt): Let's always log this.
                println!("Tauri plugin http: using cookie store at {}", path.display());
                
                let file = File::options()
                    .create(true)
                    .append(true)
                    .read(true)
                    .open(&path)?;

                let reader = BufReader::new(file);
                CookieStoreMutex::load(path.clone(), reader).unwrap_or_else(|_e| {
                    #[cfg(feature = "tracing")]
                    tracing::warn!(
                        "failed to load cookie store: {_e}, falling back to empty store"
                    );
                    CookieStoreMutex::new(path, Default::default())
                })
            };

            let state = Http {
                #[cfg(feature = "cookies")]
                cookies_jar: std::sync::Arc::new(cookies_jar),
            };

            app.manage(state);

            Ok(())
        })
        .on_event(|app, event| {
            #[cfg(feature = "cookies")]
            if let tauri::RunEvent::Exit = event {
                let state = app.state::<Http>();

                match state.cookies_jar.request_save() {
                    Ok(rx) => {
                        let _ = rx.recv();
                    }
                    Err(_e) => {
                        #[cfg(feature = "tracing")]
                        tracing::error!("failed to save cookie jar: {_e}");
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::fetch,
            commands::fetch_cancel,
            commands::fetch_send,
            commands::fetch_read_body
        ])
        .build()
}
