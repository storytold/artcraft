// Read-only smoke test against a deployed MCP server — the one place this project touches a
// real Artcraft backend. Drives exactly what a client does: register, consent (password),
// exchange the code, initialize, list tools, call every read-only tool; then the header-only
// path — a personal token created on /connections, used, and revoked; then revoke the grant.
//
//   SMOKE_BASE_URL=https://mcp.getartcraft.com SMOKE_USERNAME=… SMOKE_PASSWORD=… node scripts/smoke.mjs
//
// Exit code 0 on success, 1 on any failure. Prints step outcomes only — never tokens,
// sessions, credentials, or response bodies.

import { createHash, randomBytes } from "node:crypto";

const BASE_URL = (process.env.SMOKE_BASE_URL ?? "https://mcp.getartcraft.com").replace(/\/$/, "");
const USERNAME = process.env.SMOKE_USERNAME ?? "";
const PASSWORD = process.env.SMOKE_PASSWORD ?? "";
const REDIRECT_URI = "https://smoke.invalid/callback";
const TIMEOUT_MS = 20_000;

const EXPECTED_TOOLS = [
  "estimate_cost",
  "get_account",
  "get_credit_balance",
  "get_job_status",
  "get_jobs_status",
  "list_models",
  "list_recent_jobs",
];

async function main() {
  if (!USERNAME || !PASSWORD) fail("SMOKE_USERNAME and SMOKE_PASSWORD must be set");
  step(`target ${BASE_URL}`);

  const health = await get("/healthz");
  check(health.status === 200, "healthz answers 200");

  const prm = await getJson("/.well-known/oauth-protected-resource/mcp");
  check(prm.resource === `${BASE_URL}/mcp`, "protected resource metadata names this endpoint");
  const as = await getJson("/.well-known/oauth-authorization-server");
  check(as.client_id_metadata_document_supported === true, "CIMD is advertised");

  const client = await postJson("/register", {
    client_name: "artcraft-mcp smoke",
    redirect_uris: [REDIRECT_URI],
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
  });
  check(typeof client.client_id === "string", "dynamic client registration");

  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const authQuery = new URLSearchParams({
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: REDIRECT_URI,
    scope: "read:account read:jobs read:catalog",
    state: "smoke",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${BASE_URL}/mcp`,
  }).toString();

  const page = await fetchWithTimeout(`${BASE_URL}/authorize?${authQuery}`);
  check(page.status === 200, "consent page renders");
  const html = await page.text();
  const csrf = /name="csrf" value="([^"]+)"/.exec(html)?.[1] ?? "";
  const csrfCookie =
    /artcraft_consent=([^;]+)/.exec(page.headers.get("set-cookie") ?? "")?.[1] ?? "";
  check(csrf.length === 43 && csrf === csrfCookie, "CSRF token issued");

  const consent = await fetchWithTimeout(`${BASE_URL}/authorize`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: `artcraft_consent=${csrfCookie}`,
    },
    body: new URLSearchParams({
      auth_request: authQuery,
      csrf,
      method: "password",
      action: "allow",
      username_or_email: USERNAME,
      password: PASSWORD,
    }).toString(),
  });
  check(consent.status === 302, `sign-in + consent redirects (got ${consent.status})`);
  const location = new URL(consent.headers.get("location") ?? "");
  const code = location.searchParams.get("code") ?? "";
  check(
    code.length > 0 && location.searchParams.get("state") === "smoke",
    "authorization code issued",
  );

  const tokens = await postForm("/token", {
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: client.client_id,
    code_verifier: verifier,
    resource: `${BASE_URL}/mcp`,
  });
  check(typeof tokens.access_token === "string" && tokens.expires_in === 3600, "token exchange");
  const bearer = tokens.access_token;

  const init = await rpc(bearer, 1, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "artcraft-mcp-smoke", version: "0" },
  });
  check(init.result?.serverInfo?.name === "artcraft", "MCP initialize");

  const list = await rpc(bearer, 2, "tools/list", {});
  const names = (list.result?.tools ?? []).map((t) => t.name).sort();
  check(
    JSON.stringify(names) === JSON.stringify(EXPECTED_TOOLS),
    `tools/list = ${names.join(", ")}`,
  );

  await tool(bearer, 3, "get_account", {}, (s) => typeof s.username === "string");
  await tool(bearer, 4, "get_credit_balance", {}, (s) => Number.isInteger(s.total_credits));
  await tool(
    bearer,
    5,
    "list_models",
    { kind: "image" },
    (s) => Array.isArray(s.models) && s.models.length > 0,
  );
  await tool(
    bearer,
    6,
    "estimate_cost",
    { kind: "image", model: "flux_1_schnell" },
    (s) => "cost_in_credits" in s,
  );
  await tool(bearer, 7, "list_recent_jobs", {}, (s) => Array.isArray(s.jobs));
  await tool(bearer, 8, "get_jobs_status", { job_tokens: ["jinf_smoke_does_not_exist"] }, (s) =>
    Array.isArray(s.jobs),
  );

  await smokePersonalToken();

  const revoke = await fetchWithTimeout(new URL(as.revocation_endpoint, BASE_URL).href, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: bearer, client_id: client.client_id }).toString(),
  });
  check(revoke.status === 200, "grant revoked");
  const after = await fetchWithTimeout(`${BASE_URL}/mcp`, {
    method: "POST",
    headers: { authorization: `Bearer ${bearer}` },
  });
  check(after.status === 401, "revoked token is refused");

  console.log("smoke: OK");
}

/**
 * The header-only path (Responses API, Messages API connector): sign in on /connections,
 * create a personal token, use it at /mcp, revoke it from the page, sign out of the page.
 */
async function smokePersonalToken() {
  const page = await fetchWithTimeout(`${BASE_URL}/connections`);
  check(page.status === 200, "connections page renders");
  let csrf = consentCsrf(page);
  check(csrf.length === 43, "connections CSRF issued");

  const signIn = await fetchWithTimeout(`${BASE_URL}/connections/sign-in`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: `artcraft_consent=${csrf}`,
    },
    body: new URLSearchParams({
      csrf,
      method: "password",
      username_or_email: USERNAME,
      password: PASSWORD,
    }).toString(),
  });
  check(signIn.status === 303, `connections sign-in redirects (got ${signIn.status})`);
  const uiSession =
    /artcraft_connections=([^;]+)/.exec(signIn.headers.get("set-cookie") ?? "")?.[1] ?? "";
  check(uiSession.length === 43, "connections page session issued");
  const cookies = () => `artcraft_consent=${csrf}; artcraft_connections=${uiSession}`;

  const created = await fetchWithTimeout(`${BASE_URL}/connections/tokens/create`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies() },
    body: new URLSearchParams({
      csrf,
      method: "password",
      password: PASSWORD,
      token_label: "smoke",
      token_lifetime: "30",
    }).toString(),
  });
  check(created.status === 200, `personal token created (got ${created.status})`);
  const pat = /artcraft_pat_[A-Za-z0-9_-]{43}/.exec(await created.text())?.[0] ?? "";
  check(pat.length > 0, "personal token issued");
  csrf = consentCsrf(created) || csrf;

  const init = await rpc(pat, 20, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "artcraft-mcp-smoke", version: "0" },
  });
  check(init.result?.serverInfo?.name === "artcraft", "personal token initializes");
  await tool(pat, 21, "get_credit_balance", {}, (s) => Number.isInteger(s.total_credits));

  const listed = await fetchWithTimeout(`${BASE_URL}/connections`, {
    headers: { cookie: cookies() },
  });
  csrf = consentCsrf(listed) || csrf;
  const item =
    (await listed.text())
      .split("<li>")
      .find((chunk) => chunk.includes(`artcraft_pat_\u2026${pat.slice(-4)}`)) ?? "";
  const tokenId = /name="token_id" value="([^"]+)"/.exec(item)?.[1] ?? "";
  check(tokenId.length > 0, "personal token listed by its hint");

  const revoked = await fetchWithTimeout(`${BASE_URL}/connections/tokens/revoke`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies() },
    body: new URLSearchParams({ csrf, token_id: tokenId }).toString(),
  });
  check(revoked.status === 303, `personal token revoked (got ${revoked.status})`);
  const after = await fetchWithTimeout(`${BASE_URL}/mcp`, {
    method: "POST",
    headers: { authorization: `Bearer ${pat}` },
  });
  check(after.status === 401, "revoked personal token is refused");

  const signOut = await fetchWithTimeout(`${BASE_URL}/connections/sign-out`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies() },
    body: new URLSearchParams({ csrf }).toString(),
  });
  check(signOut.status === 303, "signed out of the connections page");
}

/** The CSRF cookie a page response (re)issues; empty when it did not set one. */
function consentCsrf(response) {
  return /artcraft_consent=([^;]+)/.exec(response.headers.get("set-cookie") ?? "")?.[1] ?? "";
}

async function tool(bearer, id, name, args, predicate) {
  const response = await rpc(bearer, id, "tools/call", { name, arguments: args });
  const result = response.result;
  const ok =
    result && !result.isError && result.structuredContent && predicate(result.structuredContent);
  check(ok, `tools/call ${name}`);
}

async function rpc(bearer, id, method, params) {
  const response = await fetchWithTimeout(`${BASE_URL}/mcp`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearer}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  check(response.status === 200, `${method} answers 200 (got ${response.status})`);
  return response.json();
}

async function get(path) {
  return fetchWithTimeout(`${BASE_URL}${path}`);
}

async function getJson(path) {
  const response = await get(path);
  check(response.status === 200, `GET ${path}`);
  return response.json();
}

async function postJson(path, body) {
  const response = await fetchWithTimeout(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  check(
    response.status === 201 || response.status === 200,
    `POST ${path} (got ${response.status})`,
  );
  return response.json();
}

async function postForm(path, fields) {
  const response = await fetchWithTimeout(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
  check(response.status === 200, `POST ${path} (got ${response.status})`);
  return response.json();
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function check(condition, description) {
  if (!condition) fail(description);
  step(description);
}

function step(message) {
  console.log(`smoke: ${message}`);
}

function fail(message) {
  console.error(`smoke: FAILED — ${message}`);
  process.exit(1);
}

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

main().catch((error) => {
  // Error messages could carry URLs but never credentials; bodies are not logged.
  fail(error instanceof Error ? error.message : String(error));
});
