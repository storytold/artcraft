mod creds;
mod inline_image;
mod server;
mod tools;

use anyhow::Result;
use rmcp::transport::stdio;
use rmcp::ServiceExt;
use tracing_subscriber::EnvFilter;

use crate::server::ArtcraftServer;

#[tokio::main]
async fn main() -> Result<()> {
  tracing_subscriber::fmt()
    .with_writer(std::io::stderr)
    .with_ansi(false)
    .with_env_filter(
      EnvFilter::try_from_env("ARTCRAFT_MCP_LOG").unwrap_or_else(|_| EnvFilter::new("info")),
    )
    .init();

  let service = ArtcraftServer::new().serve(stdio()).await?;
  service.waiting().await?;
  Ok(())
}
