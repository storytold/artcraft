use std::io::{self, BufRead, Write};

use log::info;

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
    let mut stdout = io::stdout();
    let reader = stdin.lock();

    for line in reader.lines() {
        match line {
            Ok(json_line) => {
                if json_line.trim().is_empty() {
                    continue;
                }

                let response = mcp_server.handle_request(&json_line).await;

                if let Some(resp) = response {
                    let json_response = serde_json::to_string(&resp).unwrap();
                    writeln!(stdout, "{}", json_response).unwrap();
                    stdout.flush().unwrap();
                }
            }
            Err(e) => {
                eprintln!("Error reading line: {}", e);
                break;
            }
        }
    }
}
