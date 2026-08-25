import { describe, expect, it } from "vitest";

import {
  createUpstreamClient,
  UpstreamOriginError,
  UpstreamPathNotAllowedError,
} from "../../src/upstream/client";
import { createSessionCredential, SESSION_HEADER_NAME } from "../../src/upstream/credential";

const BASE_URL = "https://api.example.test";
const SIGNED_SESSION = "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2ln";

/** A fetch that records every request and answers with a fixed JSON body. */
function recordingFetch(status = 200, body: unknown = { success: true }) {
  const requests: Request[] = [];
  const fetchImpl: typeof globalThis.fetch = (input, init) => {
    requests.push(new Request(input, init));
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
  };
  return { requests, fetch: fetchImpl };
}

function readClient(fetchImpl: typeof globalThis.fetch) {
  return createUpstreamClient({
    baseUrl: BASE_URL,
    use: "read",
    credential: createSessionCredential(SIGNED_SESSION),
    fetch: fetchImpl,
  });
}

describe("read client", () => {
  it("sends an allowlisted request with the session header, JSON accept, and our user agent", async () => {
    const { requests, fetch } = recordingFetch();
    const result = await readClient(fetch).GET("/v1/session");

    expect(result.response.status).toBe(200);
    expect(requests).toHaveLength(1);
    const sent = requests[0];
    expect(sent?.url).toBe(`${BASE_URL}/v1/session`);
    expect(sent?.method).toBe("GET");
    expect(sent?.headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
    expect(sent?.headers.get("accept")).toBe("application/json");
    expect(sent?.headers.get("user-agent")).toMatch(/^artcraft-mcp\//);
    expect(sent?.headers.get("cookie")).toBeNull();
    expect(sent?.headers.get("authorization")).toBeNull();
  });

  it("substitutes path parameters and keeps the concrete URL on the template", async () => {
    const { requests, fetch } = recordingFetch();
    await readClient(fetch).GET("/v1/jobs/job/{token}", {
      params: { path: { token: "jinf_abc123" } },
    });
    expect(requests[0]?.url).toBe(`${BASE_URL}/v1/jobs/job/jinf_abc123`);
  });

  it("serialises array query parameters as repeated keys (what the upstream parses)", async () => {
    const { requests, fetch } = recordingFetch();
    await readClient(fetch).GET("/v1/jobs/batch", {
      params: { query: { tokens: ["jinf_a", "jinf_b"] } },
    });
    const url = new URL(requests[0]?.url ?? "");
    expect(url.pathname).toBe("/v1/jobs/batch");
    expect(url.searchParams.getAll("tokens")).toEqual(["jinf_a", "jinf_b"]);
  });

  it("passes an upstream 401 through as an error result, not an exception", async () => {
    const { fetch } = recordingFetch(401, { success: false, error_code: 401 });
    const result = await readClient(fetch).GET("/v1/credits/namespace/{namespace}", {
      params: { path: { namespace: "artcraft" } },
    });
    expect(result.response.status).toBe(401);
    expect(result.data).toBeUndefined();
    expect(result.error).toEqual({ success: false, error_code: 401 });
  });

  it("requires a credential", () => {
    expect(() =>
      createUpstreamClient({ baseUrl: BASE_URL, use: "read", fetch: recordingFetch().fetch }),
    ).toThrow(/requires a credential/);
  });
});

describe("auth client", () => {
  it("may sign in without a credential and sends no session header", async () => {
    const { requests, fetch } = recordingFetch();
    const client = createUpstreamClient({ baseUrl: BASE_URL, use: "auth", fetch });
    await client.POST("/v1/login", {
      body: { username_or_email: "localdev1", password: "localdev1pass" },
    });
    const sent = requests[0];
    expect(sent?.url).toBe(`${BASE_URL}/v1/login`);
    expect(sent?.headers.get(SESSION_HEADER_NAME)).toBeNull();
    expect(sent?.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await sent?.json()).toEqual({
      username_or_email: "localdev1",
      password: "localdev1pass",
    });
  });

  it("may sign out with a credential", async () => {
    const { requests, fetch } = recordingFetch();
    const client = createUpstreamClient({
      baseUrl: BASE_URL,
      use: "auth",
      credential: createSessionCredential(SIGNED_SESSION),
      fetch,
    });
    await client.POST("/v1/logout");
    expect(requests[0]?.headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
  });
});

describe("the gate fires before anything leaves the Worker", () => {
  it("refuses an auth route from a read client, without calling fetch", async () => {
    const { requests, fetch } = recordingFetch();
    await expect(
      readClient(fetch).POST("/v1/login", { body: { username_or_email: "x", password: "y" } }),
    ).rejects.toThrow(UpstreamPathNotAllowedError);
    expect(requests).toHaveLength(0);
  });

  it("refuses a read route from an auth client", async () => {
    const { requests, fetch } = recordingFetch();
    const client = createUpstreamClient({ baseUrl: BASE_URL, use: "auth", fetch });
    await expect(client.GET("/v1/session")).rejects.toThrow(/not allowlisted for auth use/);
    expect(requests).toHaveLength(0);
  });

  it("refuses a path that is not on the allowlist at all", async () => {
    const { requests, fetch } = recordingFetch();
    const client = readClient(fetch) as unknown as { GET(path: string): Promise<unknown> };
    await expect(client.GET("/v1/media_files/list")).rejects.toThrow(UpstreamPathNotAllowedError);
    expect(requests).toHaveLength(0);
  });

  it("refuses a per-request baseUrl pointing anywhere else", async () => {
    const { requests, fetch } = recordingFetch();
    await expect(
      readClient(fetch).GET("/v1/session", { baseUrl: "https://evil.example.test" }),
    ).rejects.toThrow(UpstreamOriginError);
    expect(requests).toHaveLength(0);
  });

  it("percent-encodes a path parameter so it can never escape its segment", async () => {
    const { requests, fetch } = recordingFetch();
    await readClient(fetch).GET("/v1/jobs/job/{token}", {
      params: { path: { token: "../../v1/media_files/list" } },
    });
    const pathname = new URL(requests[0]?.url ?? "").pathname;
    expect(pathname).toBe("/v1/jobs/job/..%2F..%2Fv1%2Fmedia_files%2Flist");
    expect(pathname).toMatch(/^\/v1\/jobs\/job\/[^/]+$/);
  });

  it("does not include the credential in the rejection message", async () => {
    const { fetch } = recordingFetch();
    let rendered = "";
    try {
      await readClient(fetch).POST("/v1/login", {
        body: { username_or_email: "x", password: "y" },
      });
    } catch (error) {
      rendered = error instanceof Error ? `${error.name}: ${error.message}` : "not an Error";
    }
    expect(rendered).toMatch(/^UpstreamPathNotAllowedError: /);
    expect(rendered).not.toContain(SIGNED_SESSION);
  });
});
