use reqwest::Client;
use std::sync::LazyLock;

/// Shared client for queue polling. Jobs are polled every second or two, so
/// reusing one client keeps the connection to the queue host alive instead of
/// paying for a new TLS handshake on every poll.
pub (crate) static POLLING_HTTP_CLIENT: LazyLock<Client> = LazyLock::new(Client::new);
