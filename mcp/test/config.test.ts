import { describe, expect, it } from "vitest";

import { ConfigError, loadConfig, PRODUCTION_UPSTREAM_API_HOST } from "../src/config";

const FAKE_PREVIEW_HOST = "https://artcraft-api-fake.example-account.workers.dev";
const LOCAL_HOST = "http://localhost:12345";

describe("loadConfig", () => {
  describe("production", () => {
    it("accepts exactly the production API host", () => {
      const config = loadConfig({
        MCP_ENVIRONMENT: "production",
        UPSTREAM_API_HOST: PRODUCTION_UPSTREAM_API_HOST,
      });
      expect(config).toEqual({
        environment: "production",
        upstreamApiHost: PRODUCTION_UPSTREAM_API_HOST,
      });
    });

    it("rejects a fake or preview upstream", () => {
      expect(() =>
        loadConfig({ MCP_ENVIRONMENT: "production", UPSTREAM_API_HOST: FAKE_PREVIEW_HOST }),
      ).toThrow(ConfigError);
    });

    it("rejects localhost", () => {
      expect(() =>
        loadConfig({ MCP_ENVIRONMENT: "production", UPSTREAM_API_HOST: LOCAL_HOST }),
      ).toThrow(/production must use/);
    });
  });

  describe("preview", () => {
    it("accepts a deployed fake on workers.dev", () => {
      const config = loadConfig({
        MCP_ENVIRONMENT: "preview",
        UPSTREAM_API_HOST: FAKE_PREVIEW_HOST,
      });
      expect(config.upstreamApiHost).toBe(FAKE_PREVIEW_HOST);
    });

    it("never accepts the production API", () => {
      expect(() =>
        loadConfig({
          MCP_ENVIRONMENT: "preview",
          UPSTREAM_API_HOST: PRODUCTION_UPSTREAM_API_HOST,
        }),
      ).toThrow(/preview must never point at the production API/);
    });

    it("rejects hosts outside workers.dev", () => {
      expect(() =>
        loadConfig({ MCP_ENVIRONMENT: "preview", UPSTREAM_API_HOST: "https://api.example.com" }),
      ).toThrow(/workers\.dev/);
    });
  });

  describe("local", () => {
    it("accepts localhost with a port", () => {
      const config = loadConfig({ MCP_ENVIRONMENT: "local", UPSTREAM_API_HOST: LOCAL_HOST });
      expect(config.upstreamApiHost).toBe(LOCAL_HOST);
    });

    it("accepts 127.0.0.1", () => {
      const config = loadConfig({
        MCP_ENVIRONMENT: "local",
        UPSTREAM_API_HOST: "http://127.0.0.1:12345",
      });
      expect(config.upstreamApiHost).toBe("http://127.0.0.1:12345");
    });

    it("rejects the production API", () => {
      expect(() =>
        loadConfig({ MCP_ENVIRONMENT: "local", UPSTREAM_API_HOST: PRODUCTION_UPSTREAM_API_HOST }),
      ).toThrow(/local must use a localhost upstream/);
    });
  });

  describe("normalisation and validation", () => {
    it("strips a trailing slash and any path from the upstream host", () => {
      const config = loadConfig({
        MCP_ENVIRONMENT: "local",
        UPSTREAM_API_HOST: "http://localhost:12345/",
      });
      expect(config.upstreamApiHost).toBe(LOCAL_HOST);
    });

    it("rejects an unknown environment name", () => {
      expect(() =>
        loadConfig({ MCP_ENVIRONMENT: "staging", UPSTREAM_API_HOST: LOCAL_HOST }),
      ).toThrow(/MCP_ENVIRONMENT/);
    });

    it("rejects a missing upstream host", () => {
      expect(() => loadConfig({ MCP_ENVIRONMENT: "local" })).toThrow(/UPSTREAM_API_HOST/);
    });

    it("rejects a non-http scheme", () => {
      expect(() =>
        loadConfig({ MCP_ENVIRONMENT: "local", UPSTREAM_API_HOST: "ftp://localhost:12345" }),
      ).toThrow(ConfigError);
    });
  });
});
