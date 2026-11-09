use std::sync::OnceLock;

use log::{debug, error, info, warn};
use serde_json::Value;

use crate::auth::load_credentials;
use crate::client::ArtCraftClient;
use crate::tools;
use crate::types::*;

const DEFAULT_PROTOCOL_VERSION: &str = "2025-03-26";
const SUPPORTED_PROTOCOL_VERSIONS: &[&str] = &["2024-11-05", "2025-03-26"];
const SERVER_NAME: &str = "artcraft-mcp";

static TOOLS_LIST_JSON: OnceLock<Value> = OnceLock::new();

pub struct McpServer {
    client: ArtCraftClient,
    initialized: bool,
}

impl McpServer {
    pub fn new() -> Self {
        let credentials = load_credentials();
        let client = ArtCraftClient::new(credentials);

        Self {
            client,
            initialized: false,
        }
    }

    pub async fn handle_request(&mut self, json_line: &str) -> Option<JsonRpcResponse> {
        let request: JsonRpcRequest = match serde_json::from_str(json_line) {
            Ok(req) => req,
            Err(e) => {
                error!("Failed to parse JSON-RPC request: {}", e);
                return Some(JsonRpcResponse::error(
                    None,
                    -32700,
                    format!("Parse error: {}", e),
                ));
            }
        };

        debug!("Received method: {}", request.method);

        // Notifications (requests without an id) get no response, per JSON-RPC 2.0.
        let is_notification = request.id.is_none();

        match request.method.as_str() {
            "initialize" => Some(self.handle_initialize(request)),
            "notifications/initialized" => {
                self.initialized = true;
                info!("MCP client initialized");
                None
            }
            "tools/list" => Some(self.handle_tools_list(request)),
            "tools/call" => Some(self.handle_tool_call(request).await),
            _ => {
                if is_notification {
                    debug!("Ignoring unknown notification: {}", request.method);
                    None
                } else {
                    Some(JsonRpcResponse::error(
                        request.id,
                        -32601,
                        format!("Method not found: {}", request.method),
                    ))
                }
            }
        }
    }

    fn handle_initialize(&self, request: JsonRpcRequest) -> JsonRpcResponse {
        // Negotiate the protocol version: echo the client's version when we
        // support it; otherwise return our preferred version so the client can
        // decide whether to continue (per the MCP spec).
        let client_version = request
            .params
            .as_ref()
            .and_then(|p| p.get("protocolVersion"))
            .and_then(|v| v.as_str());

        let protocol_version = match client_version {
            Some(v) if SUPPORTED_PROTOCOL_VERSIONS.contains(&v) => v,
            Some(v) => {
                warn!(
                    "Client requested unsupported protocol version '{}'; responding with '{}'",
                    v, DEFAULT_PROTOCOL_VERSION
                );
                DEFAULT_PROTOCOL_VERSION
            }
            None => DEFAULT_PROTOCOL_VERSION,
        };

        let result = InitializeResult {
            protocol_version: protocol_version.to_string(),
            capabilities: ServerCapabilities {
                tools: ToolCapabilities { list_changed: false },
            },
            server_info: ServerInfo {
                name: SERVER_NAME.to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
            },
        };

        match serde_json::to_value(result) {
            Ok(value) => JsonRpcResponse::success(request.id, value),
            Err(e) => JsonRpcResponse::error(
                request.id,
                -32603,
                format!("Failed to serialize initialize result: {}", e),
            ),
        }
    }

    fn handle_tools_list(&self, request: JsonRpcRequest) -> JsonRpcResponse {
        let result = TOOLS_LIST_JSON.get_or_init(|| {
            let tools = tools::get_all_tools();
            serde_json::to_value(ToolsListResult { tools })
                .unwrap_or_else(|_| serde_json::json!({ "tools": [] }))
        });

        JsonRpcResponse::success(request.id, result.clone())
    }

    async fn handle_tool_call(&self, request: JsonRpcRequest) -> JsonRpcResponse {
        let params = match request.params {
            Some(p) => p,
            None => {
                return JsonRpcResponse::error(
                    request.id,
                    -32602,
                    "Missing params".to_string(),
                );
            }
        };

        let tool_request: ToolCallRequest = match serde_json::from_value(params) {
            Ok(req) => req,
            Err(e) => {
                return JsonRpcResponse::error(
                    request.id,
                    -32602,
                    format!("Invalid params: {}", e),
                );
            }
        };

        info!("Tool call: {}", tool_request.name);

        let result = tools::execute_tool(&tool_request.name, tool_request.arguments, &self.client).await;

        match result {
            Ok(content) => {
                let tool_result = ToolCallResult {
                    content,
                    is_error: Some(false),
                };
                match serde_json::to_value(tool_result) {
                    Ok(value) => JsonRpcResponse::success(request.id, value),
                    Err(e) => JsonRpcResponse::error(
                        request.id,
                        -32603,
                        format!("Failed to serialize tool result: {}", e),
                    ),
                }
            }
            Err(e) => {
                warn!("Tool {} failed: {}", tool_request.name, e);
                let tool_result = ToolCallResult {
                    content: vec![ToolContent {
                        content_type: "text".to_string(),
                        text: format!("Error: {}", e),
                    }],
                    is_error: Some(true),
                };
                match serde_json::to_value(tool_result) {
                    Ok(value) => JsonRpcResponse::success(request.id, value),
                    Err(e2) => JsonRpcResponse::error(
                        request.id,
                        -32603,
                        format!("Failed to serialize tool error: {}", e2),
                    ),
                }
            }
        }
    }
}
