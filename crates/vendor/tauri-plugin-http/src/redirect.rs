use std::sync::Arc;

use crate::scope::{Entry, Scope};

/// Applies the same permissions to every hop, before sending the next request.
pub(crate) fn redirect_policy(allowed: Vec<Arc<Entry>>, denied: Vec<Arc<Entry>>, max_redirections: Option<usize>) -> reqwest::redirect::Policy {
    use reqwest::redirect::Policy;

    if max_redirections == Some(0) {
        return Policy::none();
    }
    let limit = max_redirections.map(Policy::limited).unwrap_or_default();
    Policy::custom(move |attempt| {
        let scope = Scope::new(allowed.iter().collect(), denied.iter().collect());
        if !scope.is_allowed(attempt.url()) {
            attempt.error("redirect URL is outside the HTTP permission scope")
        } else {
            limit.redirect(attempt)
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn redirects_cannot_reach_an_unlisted_origin() {
        let destination = fixture(None);
        let origin = fixture(Some(destination.url.clone()));
        let entry = Arc::new(origin.url.parse().unwrap());
        let policy = redirect_policy(vec![entry], vec![], None);
        let result = reqwest::Client::builder().no_proxy().redirect(policy).build().unwrap().get(&origin.url).send().await;
        assert!(result.unwrap_err().is_redirect());
        assert_eq!(destination.hits.load(std::sync::atomic::Ordering::SeqCst), 0);
    }

    #[tokio::test]
    async fn explicitly_denied_destinations_override_wildcard_allow() {
        let destination = fixture(None);
        let origin = fixture(Some(destination.url.clone()));
        let allow = Arc::new("http://127.0.0.1:*".parse().unwrap());
        let deny = Arc::new(destination.url.parse().unwrap());
        let policy = redirect_policy(vec![allow], vec![deny], Some(5));
        let result = reqwest::Client::builder().no_proxy().redirect(policy).build().unwrap().get(&origin.url).send().await;
        assert!(result.unwrap_err().is_redirect());
        assert_eq!(destination.hits.load(std::sync::atomic::Ordering::SeqCst), 0);
    }

    #[tokio::test]
    async fn permitted_redirects_keep_the_response_body() {
        let destination = fixture(None);
        let origin = fixture(Some(destination.url.clone()));
        let allow = Arc::new("http://127.0.0.1:*".parse().unwrap());
        let policy = redirect_policy(vec![allow], vec![], None);
        let response = reqwest::Client::builder().no_proxy().redirect(policy).build().unwrap().get(&origin.url).send().await.unwrap();
        assert_eq!(response.text().await.unwrap(), "ok");
        assert_eq!(destination.hits.load(std::sync::atomic::Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn zero_redirects_returns_the_original_response() {
        let destination = fixture(None);
        let origin = fixture(Some(destination.url.clone()));
        let allow = Arc::new(origin.url.parse().unwrap());
        let policy = redirect_policy(vec![allow], vec![], Some(0));
        let response = reqwest::Client::builder().no_proxy().redirect(policy).build().unwrap().get(&origin.url).send().await.unwrap();
        assert_eq!(response.status(), reqwest::StatusCode::FOUND);
        assert_eq!(destination.hits.load(std::sync::atomic::Ordering::SeqCst), 0);
    }

    #[tokio::test]
    async fn redirect_limit_still_stops_an_allowed_chain() {
        let destination = fixture(None);
        let middle = fixture(Some(destination.url.clone()));
        let origin = fixture(Some(middle.url.clone()));
        let allow = Arc::new("http://127.0.0.1:*".parse().unwrap());
        let policy = redirect_policy(vec![allow], vec![], Some(1));
        let result = reqwest::Client::builder().no_proxy().redirect(policy).build().unwrap().get(&origin.url).send().await;
        assert!(result.unwrap_err().is_redirect());
        assert_eq!(destination.hits.load(std::sync::atomic::Ordering::SeqCst), 0);
    }

    struct Fixture {
        url: String,
        hits: Arc<std::sync::atomic::AtomicUsize>,
        stop: Arc<std::sync::atomic::AtomicBool>,
        thread: Option<std::thread::JoinHandle<()>>,
    }

    impl Drop for Fixture {
        fn drop(&mut self) {
            self.stop.store(true, std::sync::atomic::Ordering::SeqCst);
            self.thread.take().unwrap().join().unwrap();
        }
    }

    fn fixture(redirect: Option<String>) -> Fixture {
        use std::io::{Read, Write};
        use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
        use std::time::Duration;
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let url = format!("http://{}/", listener.local_addr().unwrap());
        let hits = Arc::new(AtomicUsize::new(0));
        let stop = Arc::new(AtomicBool::new(false));
        let (worker_hits, worker_stop) = (hits.clone(), stop.clone());
        let thread = std::thread::spawn(move || {
            while !worker_stop.load(Ordering::SeqCst) {
                match listener.accept() {
                    Ok((mut socket, _)) => {
                        socket.set_read_timeout(Some(Duration::from_secs(2))).unwrap();
                        let mut bytes = [0; 4096];
                        socket.read(&mut bytes).unwrap();
                        worker_hits.fetch_add(1, Ordering::SeqCst);
                        let response = match &redirect {
                            Some(url) => format!("HTTP/1.1 302 Found\r\nLocation: {url}\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"),
                            None => "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok".to_owned(),
                        };
                        socket.write_all(response.as_bytes()).unwrap();
                    },
                    Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(2)),
                    Err(error) => panic!("fixture accept: {error}"),
                }
            }
        });
        Fixture { url, hits, stop, thread: Some(thread) }
    }
}
