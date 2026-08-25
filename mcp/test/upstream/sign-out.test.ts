import { describe, expect, it } from "vitest";

import { createSessionCredential, SESSION_HEADER_NAME } from "../../src/upstream/credential";
import { signOutUpstream } from "../../src/upstream/sign-out";
import { SIGNED_SESSION } from "../helpers/fixtures";

describe("signOutUpstream", () => {
  it("posts /v1/logout with the session header and reports success", async () => {
    const requests: Request[] = [];
    const ok = await signOutUpstream(
      "https://api.example.test",
      createSessionCredential(SIGNED_SESSION),
      (input, init) => {
        requests.push(new Request(input, init));
        return Promise.resolve(
          new Response(JSON.stringify({ success: true }), {
            headers: { "content-type": "application/json" },
          }),
        );
      },
    );
    expect(ok).toBe(true);
    expect(requests[0]?.method).toBe("POST");
    expect(new URL(requests[0]?.url ?? "").pathname).toBe("/v1/logout");
    expect(requests[0]?.headers.get(SESSION_HEADER_NAME)).toBe(SIGNED_SESSION);
  });

  it("reports failure on a non-2xx and on a network error, without throwing", async () => {
    const denied = await signOutUpstream(
      "https://api.example.test",
      createSessionCredential(SIGNED_SESSION),
      () => Promise.resolve(new Response("{}", { status: 500 })),
    );
    expect(denied).toBe(false);
    const down = await signOutUpstream(
      "https://api.example.test",
      createSessionCredential(SIGNED_SESSION),
      () => Promise.reject(new Error("ECONNREFUSED")),
    );
    expect(down).toBe(false);
  });
});
