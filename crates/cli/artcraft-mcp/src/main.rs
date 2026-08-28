mod creds;
mod errors;
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
  if std::env::args().any(|a| a == "--check" || a == "-c") {
    return run_check_mode().await;
  }

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

/// Diagnostic mode (`artcraft-mcp --check`). Prints a human-readable
/// status report to stdout — handy for users who don't see the Artcraft
/// tools in Claude and want to figure out why without round-tripping
/// through the MCP transport.
async fn run_check_mode() -> Result<()> {
  let report = tools::check_artcraft_connection::run().await;
  match report {
    Ok(value) => {
      println!("artcraft-mcp check:");
      println!("{}", serde_json::to_string_pretty(&value).unwrap_or_default());
      Ok(())
    }
    Err(err) => {
      let body = serde_json::to_string_pretty(&err).unwrap_or_else(|_| format!("{:?}", err));
      println!("artcraft-mcp check FAILED:");
      println!("{}", body);
      std::process::exit(1);
    }
  }
}
