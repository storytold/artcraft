import { describe, expect, it } from "vitest";

import {
  AllowlistError,
  findRoute,
  findRouteForPathname,
  isAllowed,
  parseAllowlist,
  UPSTREAM_ROUTES,
} from "../../src/upstream/allowlist";
import spec from "../fixtures/api.json";

describe("the committed allowlist", () => {
  it("loads", () => {
    expect(UPSTREAM_ROUTES.length).toBeGreaterThan(0);
  });

  it("only names routes that exist in the spec snapshot with that method", () => {
    const missing = UPSTREAM_ROUTES.filter((route) => {
      const pathItem = (spec.paths as Record<string, Record<string, unknown>>)[route.path];
      return pathItem?.[route.method] === undefined;
    });
    expect(missing).toEqual([]);
  });

  it("covers every operation in the spec snapshot (the snapshot is trimmed to the allowlist)", () => {
    const operations = Object.entries(spec.paths).flatMap(([path, item]) =>
      Object.keys(item).map((method) => `${method} ${path}`),
    );
    const listed = UPSTREAM_ROUTES.map((route) => `${route.method} ${route.path}`);
    expect(operations.sort()).toEqual(listed.sort());
  });

  it("marks sign-in and sign-out as auth-only and everything else as read", () => {
    const auth = UPSTREAM_ROUTES.filter((route) => route.use === "auth").map((r) => r.path);
    expect(auth.sort()).toEqual(["/v1/accounts/google_sso", "/v1/login", "/v1/logout"]);
    expect(
      UPSTREAM_ROUTES.filter((route) => route.use === "read").every(
        (r) => r.method === "get" || r.path.startsWith("/v1/omni_gen/cost/"),
      ),
    ).toBe(true);
  });
});

describe("lookups", () => {
  it("finds a route by method and template path, case-insensitively on method", () => {
    expect(findRoute("GET", "/v1/session")?.use).toBe("read");
    expect(findRoute("get", "/v1/jobs/job/{token}")?.use).toBe("read");
  });

  it("does not find a route by concrete path through findRoute", () => {
    expect(findRoute("GET", "/v1/jobs/job/jinf_abc")).toBeUndefined();
  });

  it("does not find an allowlisted path under the wrong method", () => {
    expect(findRoute("DELETE", "/v1/jobs/job/{token}")).toBeUndefined();
    expect(findRoute("POST", "/v1/session")).toBeUndefined();
  });

  it("matches a concrete path against a template, one segment per variable", () => {
    expect(findRouteForPathname("GET", "/v1/jobs/job/jinf_abc123")?.path).toBe(
      "/v1/jobs/job/{token}",
    );
    expect(findRouteForPathname("GET", "/v1/credits/namespace/artcraft")?.path).toBe(
      "/v1/credits/namespace/{namespace}",
    );
    expect(findRouteForPathname("GET", "/v1/jobs/job/a/b")).toBeUndefined();
    expect(findRouteForPathname("GET", "/v1/jobs/job/")).toBeUndefined();
    expect(findRouteForPathname("GET", "/v1/jobs/jobx")).toBeUndefined();
  });

  it("treats template literals as literals, not patterns", () => {
    expect(findRouteForPathname("GET", "/v1/omni_gen/models/image")).toBeDefined();
    expect(findRouteForPathname("GET", "/v1/omni_gen/models/imageX")).toBeUndefined();
    expect(findRouteForPathname("GET", "/v1XomniXgen/models/image")).toBeUndefined();
  });
});

describe("use gating", () => {
  it("lets read callers use read routes and refuses auth routes", () => {
    expect(isAllowed(findRoute("GET", "/v1/session"), "read")).toBe(true);
    expect(isAllowed(findRoute("POST", "/v1/login"), "read")).toBe(false);
  });

  it("lets auth callers use auth routes only", () => {
    expect(isAllowed(findRoute("POST", "/v1/logout"), "auth")).toBe(true);
    expect(isAllowed(findRoute("GET", "/v1/credits/namespace/{namespace}"), "auth")).toBe(false);
  });

  it("refuses unknown routes for every use", () => {
    expect(isAllowed(undefined, "read")).toBe(false);
    expect(isAllowed(undefined, "auth")).toBe(false);
  });
});

describe("allowlist validation fires on a bad document", () => {
  const good = { routes: [{ method: "get", path: "/v1/session", use: "read" }] };

  it("accepts a well-formed document", () => {
    expect(parseAllowlist(good)).toHaveLength(1);
  });

  it("rejects a method other than get/post (no deletes, ever)", () => {
    expect(() =>
      parseAllowlist({ routes: [{ method: "delete", path: "/v1/jobs/job/{token}", use: "read" }] }),
    ).toThrow(AllowlistError);
  });

  it("rejects a path outside /v1", () => {
    expect(() =>
      parseAllowlist({ routes: [{ method: "get", path: "/_status", use: "read" }] }),
    ).toThrow(/must be a \/v1 path/);
  });

  it("rejects an unknown use", () => {
    expect(() =>
      parseAllowlist({ routes: [{ method: "get", path: "/v1/session", use: "generate" }] }),
    ).toThrow(AllowlistError);
  });

  it("rejects duplicates", () => {
    expect(() => parseAllowlist({ routes: [...good.routes, ...good.routes] })).toThrow(
      /duplicate allowlist route: get \/v1\/session/,
    );
  });

  it("rejects an empty list", () => {
    expect(() => parseAllowlist({ routes: [] })).toThrow(AllowlistError);
  });
});
