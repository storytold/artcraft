import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UserInfo } from "~/models";
import { PromptsApi } from "~/Classes/ApiManager/PromptsApi";

const mockPrompts = {
  created_at: "2024-06-14T17:33:39.283Z",
  lcm_disabled: true,
  lipsync_enabled: true,
  maybe_inference_duration_millis: 0,
  maybe_moderator_fields: "string",
  maybe_negative_prompt: "string",
  maybe_positive_prompt: "string",
  maybe_strength: 0,
  maybe_style_name: "anime_2_5d",
  prompt_type: "stable_diffusion",
  token: "string",
  use_cinematic: true,
  used_face_detailer: true,
  used_upscaler: true,
};

describe("PromptsApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("FetchRecentJobs", () => {
    it("fetch data", async () => {
      const api = new PromptsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
        prompt: mockPrompts,
      });
      const response = await api.GetPromptsByToken({ token: "t1" });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/prompts/t1",
        {
          method: "GET",
          body: undefined,
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: mockPrompts,
      });
    });

    it("exception", async () => {
      const api = new PromptsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.GetPromptsByToken({ token: "t1" });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/prompts/t1",
        {
          method: "GET",
          body: undefined,
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });
});
