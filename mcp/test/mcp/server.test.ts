import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { createMcpServer, SERVER_INFO } from "../../src/mcp/server";
import { principalFromProps } from "../../src/tokens/principal";
import { createUpstreamClient } from "../../src/upstream/client";
import { fixture } from "../helpers/contract";

/** Drives the server the way a real MCP client does — over the protocol, in memory. */

const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

const CREDITS = fixture("GetSessionCreditsResponse", {
  success: true,
  free_credits: 0,
  monthly_credits: 10,
  banked_credits: 5,
  sum_total_credits: 15,
});
const NO_SUBSCRIPTION = fixture("GetSessionSubscriptionResponse", {
  success: true,
  active_subscription: null,
});

function principalWith(scopes: string[]) {
  return principalFromProps({
    credential: { kind: "session", signedSession: SIGNED_SESSION },
    grantIssuedAt: 1_800_000_000_000,
    userToken: "user_x",
    username: "x",
    displayName: "X",
    scopes,
  });
}

async function connect(scopes: string[], status = 200) {
  const principal = principalWith(scopes);
  const upstream = createUpstreamClient({
    baseUrl: "https://api.example.test",
    use: "read",
    credential: principal.credential,
    fetch: (input) => {
      const path = new URL(new Request(input).url).pathname;
      const body = path.startsWith("/v1/credits") ? CREDITS : NO_SUBSCRIPTION;
      return Promise.resolve(
        new Response(
          JSON.stringify(status === 200 ? body : { success: false, error_code: status }),
          {
            status,
            headers: { "content-type": "application/json" },
          },
        ),
      );
    },
  });
  let invalidated = 0;
  const server = createMcpServer({
    principal,
    upstream,
    onUpstreamSessionInvalid: () => {
      invalidated += 1;
    },
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return { client, invalidated: () => invalidated };
}

describe("MCP server", () => {
  it("identifies itself and lists get_credit_balance with its schema and annotations", async () => {
    const { client } = await connect(["read:account"]);
    expect(client.getServerVersion()).toMatchObject(SERVER_INFO);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(["get_credit_balance"]);
    const tool = tools[0];
    expect(tool?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
    expect(tool?.outputSchema).toBeDefined();
    expect(tool?.description).toMatch(/credit balance/);
  });

  it("hides tools the principal's scopes do not cover", async () => {
    const { client } = await connect(["read:catalog"]);
    const { tools } = await client.listTools();
    expect(tools).toEqual([]);
  });

  it("returns structured content and text from a tool call", async () => {
    const { client } = await connect(["read:account"]);
    const result = await client.callTool({ name: "get_credit_balance", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({ total_credits: 15, subscription: null });
    expect(result.content).toEqual([
      {
        type: "text",
        text: "15 credits available (10 monthly, 5 banked, 0 free). No active subscription.",
      },
    ]);
  });

  it("reports an invalid upstream session as a tool error and notifies the handler", async () => {
    const { client, invalidated } = await connect(["read:account"], 401);
    const result = await client.callTool({ name: "get_credit_balance", arguments: {} });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toMatch(/no longer valid/);
    expect(invalidated()).toBe(1);
  });

  it("reports an unavailable upstream as a tool error without notifying", async () => {
    const { client, invalidated } = await connect(["read:account"], 503);
    const result = await client.callTool({ name: "get_credit_balance", arguments: {} });
    expect(result.isError).toBe(true);
    expect(invalidated()).toBe(0);
  });
});
