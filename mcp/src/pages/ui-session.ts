/**
 * The connections page's own sign-in: a short-lived, random session id in an HttpOnly cookie,
 * mapped in KV to the Artcraft user token. It holds no upstream credential — the page only
 * needs to know *who* is looking, to list and revoke their grants. Keys use their own prefix
 * so they never collide with the OAuth provider's records in the same namespace.
 */

export const UI_SESSION_COOKIE_NAME = "artcraft_connections";
const KEY_PREFIX = "mcpui:session:";
const TTL_SECONDS = 15 * 60;
const ID_BYTES = 32;

export interface UiSession {
  readonly userToken: string;
  readonly username: string;
}

export interface UiSessionStore {
  create(session: UiSession): Promise<string>;
  read(id: string | undefined): Promise<UiSession | undefined>;
  destroy(id: string | undefined): Promise<void>;
}

export function createUiSessionStore(kv: KVNamespace): UiSessionStore {
  return {
    async create(session) {
      const id = base64Url(crypto.getRandomValues(new Uint8Array(ID_BYTES)));
      await kv.put(KEY_PREFIX + id, JSON.stringify(session), { expirationTtl: TTL_SECONDS });
      return id;
    },
    async read(id) {
      if (!id || !isWellFormed(id)) return undefined;
      const raw = await kv.get(KEY_PREFIX + id);
      if (raw === null) return undefined;
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof (parsed as UiSession).userToken !== "string" ||
        typeof (parsed as UiSession).username !== "string"
      ) {
        return undefined;
      }
      return {
        userToken: (parsed as UiSession).userToken,
        username: (parsed as UiSession).username,
      };
    },
    async destroy(id) {
      if (id && isWellFormed(id)) await kv.delete(KEY_PREFIX + id);
    },
  };
}

export function uiSessionCookieHeader(id: string, secure: boolean): string {
  const attributes = [
    `${UI_SESSION_COOKIE_NAME}=${id}`,
    "Path=/connections",
    `Max-Age=${String(TTL_SECONDS)}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) attributes.push("Secure");
  return attributes.join("; ");
}

export function clearedUiSessionCookieHeader(): string {
  return `${UI_SESSION_COOKIE_NAME}=; Path=/connections; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function readUiSessionCookie(request: Request): string | undefined {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === UI_SESSION_COOKIE_NAME) return rest.join("=");
  }
  return undefined;
}

function isWellFormed(id: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(id);
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
