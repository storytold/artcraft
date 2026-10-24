import { describe, expect, it } from "vitest";
import { ApiManager } from "~/Classes/ApiManager/ApiManager";

// ApiManager's two parse helpers are protected, so a tiny subclass exposes them to the test.
class ExposedApiManager extends ApiManager {
  public query(params: Record<string, string | string[] | boolean | number | undefined>) {
    return this.parseQueryValues(params);
  }
  public body(params: Record<string, unknown>) {
    return this.parseBodyValues<Record<string, unknown>, Record<string, unknown>>(
      params as never,
    );
  }
}

describe("ApiManager parse helpers keep falsy values", () => {
  it("parseQueryValues sends false, 0 and an empty string, and drops only undefined", () => {
    const api = new ExposedApiManager();
    expect(
      api.query({ sortAscending: false, pageIndex: 0, searchTerm: "", missing: undefined }),
    ).toEqual({ sort_ascending: "false", page_index: "0", search_term: "" });
  });

  it("parseBodyValues sends false, 0 and an empty string, and drops only undefined", () => {
    const api = new ExposedApiManager();
    expect(
      api.body({ isPublic: false, count: 0, description: "", missing: undefined }),
    ).toEqual({ is_public: false, count: 0, description: "" });
  });
});
