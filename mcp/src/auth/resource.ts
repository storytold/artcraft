/**
 * What the protected resource is: its route, its name, and the scopes a token may carry.
 * Lives apart from the provider options so token modules can depend on it without pulling in
 * the provider wiring (which in turn depends on them — no import cycles).
 */

/** Protected route prefixes. Tokens are audience-bound to `/mcp`; nothing else is protected. */
export const MCP_ROUTES = ["/mcp"] as const;

/** Scopes a grant may carry in M1. `generate` is deliberately absent until it has a design. */
export const SCOPES = ["read:account", "read:jobs", "read:catalog"] as const;
export type Scope = (typeof SCOPES)[number];

export const RESOURCE_NAME = "Artcraft";
