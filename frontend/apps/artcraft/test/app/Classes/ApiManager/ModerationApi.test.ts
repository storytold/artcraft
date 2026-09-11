import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UserInfo } from "~/models";
import { ModerationApi } from "~/Classes/ApiManager/ModerationApi";

describe("ModerationApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("UpdateFeatureFlagsByToken", () => {
    it("success", async () => {
      const api = new ModerationApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
      });
      const response = await api.UpdateFeatureFlagsByToken({
        usernameOrToken: "token",
        flags: ["flag1", "flag2"],
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/moderation/user_feature_flags/token",
        {
          method: "POST",
          body: {
            action: {
              AddFlags: {
                flags: ["flag1", "flag2"],
              },
            },
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        errorMessage: undefined,
      });
    });

    it("failure", async () => {
      const api = new ModerationApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        BadInput: "error",
      });
      const response = await api.UpdateFeatureFlagsByToken({
        usernameOrToken: "token",
        flags: ["flag1", "flag2"],
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/moderation/user_feature_flags/token",
        {
          method: "POST",
          body: {
            action: {
              AddFlags: {
                flags: ["flag1", "flag2"],
              },
            },
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "error",
      });
    });

    it("exception", async () => {
      const api = new ModerationApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("error"));
      const response = await api.UpdateFeatureFlagsByToken({
        usernameOrToken: "token",
        flags: ["flag1", "flag2"],
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/moderation/user_feature_flags/token",
        {
          method: "POST",
          body: {
            action: {
              AddFlags: {
                flags: ["flag1", "flag2"],
              },
            },
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "error",
      });
    });
  });
});
