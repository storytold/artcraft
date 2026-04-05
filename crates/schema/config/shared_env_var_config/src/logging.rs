/// NB: `sqlx::query` is spammy and dumps all queries as "info"-level log lines.
/// NB: `hyper::proto::h1::io` is incredibly spammy and logs every chunk of bytes in very large files being downloaded.
pub const DEFAULT_RUST_LOG: &str = concat!(
  "actix_web=info,",
  "sqlx::query=warn,",
  "hyper::proto::h1::io=warn,",
  "storyteller_web::threads::db_health_checker_thread::db_health_checker_thread=warn,",
  "http_server_common::request::get_request_ip=info,", // Debug spams Rust logs
  "info", // Default level for everything else
);
