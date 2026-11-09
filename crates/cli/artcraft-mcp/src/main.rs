use log::{error, info};
use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader};

mod auth;
mod client;
mod server;
mod tools;
mod types;

#[tokio::main]
async fn main() {
    env_logger::init();
    info!("ArtCraft MCP Server starting");

    let mut mcp_server = server::McpServer::new();

    let stdin = io::stdin();
    let mut reader = BufReader::new(stdin);
    let mut stdout = io::stdout();
    let mut line = String::new();

    loop {
        line.clear();
        match reader.read_line(&mut line).await {
            Ok(0) => {
                info!("Stdin closed, shutting down");
                break;
            }
            Ok(_) => {
                let json_line = line.trim();
                if json_line.is_empty() {
                    continue;
                }

                if let Some(resp) = mcp_server.handle_request(json_line).await {
                    let json_response = match serde_json::to_string(&resp) {
                        Ok(s) => s,
                        Err(e) => {
                            error!("Failed to serialize response: {}", e);
                            continue;
                        }
                    };
                    if let Err(e) = stdout.write_all(json_response.as_bytes()).await {
                        error!("Failed to write response: {}", e);
                        break;
                    }
                    if let Err(e) = stdout.write_all(b"\n").await {
                        error!("Failed to write response: {}", e);
                        break;
                    }
                    if let Err(e) = stdout.flush().await {
                        error!("Failed to flush response: {}", e);
                        break;
                    }
                }
            }
            Err(e) => {
                error!("Error reading stdin: {}", e);
                break;
            }
        }
    }
}
