// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use std::sync::Arc;

use serde::{Deserialize, Deserializer};
use url::Url;
use urlpattern::{UrlPattern, UrlPatternMatchInput};

#[allow(rustdoc::bare_urls)]
#[derive(Debug)]
pub struct Entry {
    pub url: UrlPattern,
}

fn parse_url_pattern(s: &str) -> Result<UrlPattern, urlpattern::quirks::Error> {
    let mut init = urlpattern::UrlPatternInit::parse_constructor_string::<regex::Regex>(s, None)?;
    if init.search.as_ref().map(|p| p.is_empty()).unwrap_or(true) {
        init.search.replace("*".to_string());
    }
    if init.hash.as_ref().map(|p| p.is_empty()).unwrap_or(true) {
        init.hash.replace("*".to_string());
    }
    if init
        .pathname
        .as_ref()
        .map(|p| p.is_empty() || p == "/")
        .unwrap_or(true)
    {
        init.pathname.replace("*".to_string());
    }
    UrlPattern::parse(init, Default::default())
}

#[derive(Deserialize)]
#[serde(untagged)]
pub(crate) enum EntryRaw {
    Value(String),
    Object { url: String },
}

impl<'de> Deserialize<'de> for Entry {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        EntryRaw::deserialize(deserializer).and_then(|raw| {
            let url = match raw {
                EntryRaw::Value(url) => url,
                EntryRaw::Object { url } => url,
            };
            Ok(Entry {
                url: parse_url_pattern(&url).map_err(|e| {
                    serde::de::Error::custom(format!("`{}` is not a valid URL pattern: {e}", url))
                })?,
            })
        })
    }
}

/// Scope for filesystem access.
#[derive(Debug)]
pub struct Scope<'a> {
    allowed: Vec<&'a Arc<Entry>>,
    denied: Vec<&'a Arc<Entry>>,
}

impl<'a> Scope<'a> {
    /// Creates a new scope from the scope configuration.
    pub(crate) fn new(allowed: Vec<&'a Arc<Entry>>, denied: Vec<&'a Arc<Entry>>) -> Self {
        Self { allowed, denied }
    }

    /// Determines if the given URL is allowed on this scope.
    pub fn is_allowed(&self, url: &Url) -> bool {
        let denied = self.denied.iter().any(|entry| {
            entry
                .url
                .test(UrlPatternMatchInput::Url(url.clone()))
                .unwrap_or_default()
        });
        if denied {
            false
        } else {
            self.allowed.iter().any(|entry| {
                entry
                    .url
                    .test(UrlPatternMatchInput::Url(url.clone()))
                    .unwrap_or_default()
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use std::{str::FromStr, sync::Arc};

    use super::Entry;

    impl FromStr for Entry {
        type Err = urlpattern::quirks::Error;

        fn from_str(s: &str) -> Result<Self, Self::Err> {
            let pattern = super::parse_url_pattern(s)?;
            Ok(Self { url: pattern })
        }
    }

    #[test]
    fn denied_takes_precedence() {
        let allow = Arc::new("http://localhost:8080/file.png".parse().unwrap());
        let deny = Arc::new("http://localhost:8080/*".parse().unwrap());
        let scope = super::Scope::new(vec![&allow], vec![&deny]);
        assert!(!scope.is_allowed(&"http://localhost:8080/file.png".parse().unwrap()));
        assert!(!scope.is_allowed(&"http://localhost:8080?framework=tauri".parse().unwrap()));
    }

    #[test]
    fn fixed_url() {
        // plain URL
        let entry = Arc::new("http://localhost:8080".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());
        assert!(scope.is_allowed(&"http://localhost:8080".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/file".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/path/to/asset.png".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/path/list?limit=50".parse().unwrap()));

        assert!(!scope.is_allowed(&"https://localhost:8080".parse().unwrap()));
        assert!(!scope.is_allowed(&"http://localhost:8081".parse().unwrap()));
        assert!(!scope.is_allowed(&"http://local:8080".parse().unwrap()));
    }

    #[test]
    fn fixed_path() {
        // URL with fixed path
        let entry = Arc::new("http://localhost:8080/file.png".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"http://localhost:8080/file.png".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/file.png?q=1".parse().unwrap()));

        assert!(!scope.is_allowed(&"http://localhost:8080".parse().unwrap()));
        assert!(!scope.is_allowed(&"http://localhost:8080/file".parse().unwrap()));
        assert!(!scope.is_allowed(&"http://localhost:8080/file.png/other.jpg".parse().unwrap()));
    }

    #[test]
    fn pattern_wildcard() {
        let entry = Arc::new("http://localhost:8080/*.png".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"http://localhost:8080/file.png".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/file.png#head".parse().unwrap()));
        assert!(scope.is_allowed(&"http://localhost:8080/assets/file.png".parse().unwrap()));
        assert!(scope.is_allowed(
            &"http://localhost:8080/assets/file.png?width=100&height=200"
                .parse()
                .unwrap()
        ));

        assert!(!scope.is_allowed(&"http://localhost:8080/file.jpeg".parse().unwrap()));
    }

    #[test]
    fn domain_wildcard() {
        let entry = Arc::new("http://*".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"http://something.else".parse().unwrap()));
        assert!(scope.is_allowed(&"http://something.else#tauri".parse().unwrap()));
        assert!(scope.is_allowed(&"http://something.else/path/to/file".parse().unwrap()));
        assert!(scope.is_allowed(&"http://something.else?rel=tauri".parse().unwrap()));
        assert!(scope.is_allowed(
            &"http://something.else/path/to/file.mp4?start=500"
                .parse()
                .unwrap()
        ));

        assert!(!scope.is_allowed(&"https://something.else".parse().unwrap()));

        let entry = Arc::new("http://*/*".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"http://something.else".parse().unwrap()));
        assert!(scope.is_allowed(&"http://something.else/path/to/file".parse().unwrap()));
    }

    #[test]
    fn scheme_wildcard() {
        let entry = Arc::new("*://*".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"http://something.else".parse().unwrap()));
        assert!(scope.is_allowed(&"http://something.else/path/to/file".parse().unwrap()));
        assert!(scope.is_allowed(&"file://path".parse().unwrap()));
        assert!(scope.is_allowed(&"file://path/to/file".parse().unwrap()));
        assert!(scope.is_allowed(&"https://something.else".parse().unwrap()));
        assert!(scope.is_allowed(&"https://something.else?x=1#frag".parse().unwrap()));

        let entry = Arc::new("*://*/*".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"http://something.else".parse().unwrap()));
        assert!(scope.is_allowed(&"http://something.else/path/to/file".parse().unwrap()));
        assert!(scope.is_allowed(&"file://path/to/file".parse().unwrap()));
        assert!(scope.is_allowed(&"https://something.else".parse().unwrap()));
    }

    #[test]
    fn validate_query() {
        let entry = Arc::new("https://tauri.app/path?x=*".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"https://tauri.app/path?x=5".parse().unwrap()));

        assert!(!scope.is_allowed(&"https://tauri.app/path?y=5".parse().unwrap()));
    }

    #[test]
    fn validate_hash() {
        let entry = Arc::new("https://tauri.app/path#frame*".parse().unwrap());
        let scope = super::Scope::new(vec![&entry], Vec::new());

        assert!(scope.is_allowed(&"https://tauri.app/path#frame".parse().unwrap()));

        assert!(!scope.is_allowed(&"https://tauri.app/path#work".parse().unwrap()));
    }
}
