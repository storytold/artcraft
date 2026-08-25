import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

import { hasScope, type Principal } from "../tokens/principal";
import type { UpstreamClient } from "../upstream/client";
import { getAccount } from "./tools/get-account";
import { getCreditBalance } from "./tools/get-credit-balance";
import { listModels } from "./tools/list-models";
import { type ToolDefinition, ToolFailure, UpstreamSessionInvalid } from "./tools/types";

/**
 * Builds the MCP server for one principal. Only tools the principal's scopes allow are
 * registered, so `tools/list` reflects permissions rather than advertising what a call would
 * refuse. Every handler runs against the principal's own upstream client.
 */

export const SERVER_INFO = { name: "artcraft", version: "0.0.0" } as const;

export const TOOLS: readonly ToolDefinition<z.ZodRawShape, z.ZodRawShape>[] = [
  getAccount,
  getCreditBalance,
  listModels,
];

export interface McpServerDeps {
  readonly principal: Principal;
  readonly upstream: UpstreamClient;
  /** Called when a tool learns the upstream no longer accepts the grant's credential. */
  readonly onUpstreamSessionInvalid?: () => void;
  readonly tools?: readonly ToolDefinition<z.ZodRawShape, z.ZodRawShape>[];
}

export function createMcpServer(deps: McpServerDeps): McpServer {
  const server = new McpServer(SERVER_INFO);
  const tools = deps.tools ?? TOOLS;
  const context = { principal: deps.principal, upstream: deps.upstream };

  let registered = 0;
  for (const tool of tools) {
    if (!hasScope(deps.principal, tool.requiredScope)) continue;
    registered += 1;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        annotations: tool.annotations,
      },
      async (input: Record<string, unknown>): Promise<CallToolResult> => {
        try {
          const result = await tool.handler(context, input);
          return {
            content: [{ type: "text", text: result.text }],
            structuredContent: result.structured,
          };
        } catch (error) {
          if (error instanceof UpstreamSessionInvalid) {
            deps.onUpstreamSessionInvalid?.();
            return failure(error.message);
          }
          if (error instanceof ToolFailure) return failure(error.message);
          throw error;
        }
      },
    );
  }

  // The SDK installs tools/list and tools/call only when the first tool is registered. A
  // principal whose scopes leave nothing to register must still get an empty list, not
  // "method not found" — so in that case declare the capability and answer ourselves.
  if (registered === 0) installEmptyToolHandlers(server);

  return server;
}

function installEmptyToolHandlers(server: McpServer): void {
  server.server.registerCapabilities({ tools: { listChanged: true } });
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: [] }));
  server.server.setRequestHandler(CallToolRequestSchema, (request) => {
    throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} not found`);
  });
}

function failure(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}
