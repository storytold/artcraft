import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  captureLandingContext,
  getLandingUrl,
  getReferralCode,
  getReferralUsername,
  getReferrer,
} from "./referral";

const KEYS = [
  "referral_username",
  "referral_code",
  "referral_landing_url",
  "referral_referrer",
];

// Expire every cookie the module writes so tests do not leak into each other.
const clearStorage = () => {
  for (const key of KEYS) {
    document.cookie = `${key}=; Max-Age=0; Path=/`;
  }
  localStorage.clear();
};

beforeEach(clearStorage);
afterEach(() => {
  clearStorage();
  window.history.replaceState({}, "", "/");
});

describe("captureLandingContext", () => {
  it("stores a sanitised referral username and code from the query string", () => {
    window.history.replaceState({}, "", "/?u=Bob_Smith!!&r=ABC-123%20xyz");
    captureLandingContext();
    // username: lowercased, anything outside [a-z0-9_] stripped
    expect(getReferralUsername()).toBe("bob_smith");
    // code: whitespace stripped, allowed chars kept
    expect(getReferralCode()).toBe("ABC-123xyz");
  });

  it("caps the referral username at 20 characters", () => {
    window.history.replaceState({}, "", `/?u=${"a".repeat(40)}`);
    captureLandingContext();
    expect(getReferralUsername()).toBe("a".repeat(20));
  });

  it("keeps the first landing url, but lets a fresh ?u= replace the username", () => {
    window.history.replaceState({}, "", "/first?u=alice");
    captureLandingContext();
    window.history.replaceState({}, "", "/second?u=bob");
    captureLandingContext();
    expect(getLandingUrl()).toContain("/first");
    expect(getReferralUsername()).toBe("bob");
  });

  it("leaves an existing referral alone when the page has no ?u=", () => {
    window.history.replaceState({}, "", "/?u=alice");
    captureLandingContext();
    window.history.replaceState({}, "", "/plain");
    captureLandingContext();
    expect(getReferralUsername()).toBe("alice");
  });

  it("reports nothing when nothing was ever captured", () => {
    expect(getReferralUsername()).toBeUndefined();
    expect(getReferralCode()).toBeUndefined();
    expect(getLandingUrl()).toBeUndefined();
    expect(getReferrer()).toBeUndefined();
  });
});

describe("cookie decoding", () => {
  it("falls back to localStorage instead of throwing on a malformed cookie escape", () => {
    // "%E0%A4%A" is an invalid UTF-8 percent sequence: decodeURIComponent throws a URIError.
    document.cookie = "referral_landing_url=%E0%A4%A; Path=/";
    // Precondition: jsdom really kept the bad cookie, so the decode path is exercised.
    expect(document.cookie).toContain("referral_landing_url=%E0%A4%A");
    expect(() => decodeURIComponent("%E0%A4%A")).toThrow();
    localStorage.setItem("referral_landing_url", "https://stored.test/");
    expect(() => getLandingUrl()).not.toThrow();
    expect(getLandingUrl()).toBe("https://stored.test/");
  });

  it("returns undefined for a malformed cookie when there is no localStorage fallback", () => {
    document.cookie = "referral_referrer=%E0%A4%A; Path=/";
    expect(getReferrer()).toBeUndefined();
  });
});
