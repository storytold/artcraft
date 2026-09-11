import { ApiManager } from "~/Classes/ApiManager/ApiManager";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";

describe("ApiManager", () => {
  let apiManager: ApiManager;
  beforeAll(() => {
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  beforeEach(() => {
    apiManager = new ApiManager();
  });
  it("should be defined", () => {
    expect(apiManager).toBeDefined();
  });
  it("should populate the environment variables", () => {
    expect(apiManager.ApiTargets).toEqual({
      BaseApi: "http://localhost:3000",
      CdnApi: undefined,
      FunnelApi: undefined,
      GoggleApi: undefined,
      GravatarApi: undefined,
    });
  });
});
