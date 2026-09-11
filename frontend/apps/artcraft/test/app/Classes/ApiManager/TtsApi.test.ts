import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { TtsApi } from "~/Classes/ApiManager/TtsApi";
import { UserInfo } from "~/models";
import { Visibility } from "~/enums";

describe("TtsApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("GenerateTtsAudio", () => {
    it("success no visibility", async () => {
      const api = new TtsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        inference_job_token: "ijt1",
        inference_job_token_type: "ijtt1",
        success: true,
      });
      const response = await api.GenerateTtsAudio({
        uuid_idempotency_token: "uit1",
        tts_model_token: "tmt1",
        inference_text: "inference text",
        is_storyteller_demo: false,
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/tts/inference",
        {
          method: "POST",
          body: {
            creator_set_visibility: "public",
            uuid_idempotency_token: "uit1",
            tts_model_token: "tmt1",
            inference_text: "inference text",
            is_storyteller_demo: false,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: {
          inference_job_token: "ijt1",
          inference_job_token_type: "ijtt1",
        },
      });
    });

    it("success visibility", async () => {
      const api = new TtsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        inference_job_token: "ijt1",
        inference_job_token_type: "ijtt1",
        success: true,
      });
      const response = await api.GenerateTtsAudio({
        creator_set_visibility: Visibility.Private,
        uuid_idempotency_token: "uit1",
        tts_model_token: "tmt1",
        inference_text: "inference text",
        is_storyteller_demo: false,
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/tts/inference",
        {
          method: "POST",
          body: {
            creator_set_visibility: "private",
            uuid_idempotency_token: "uit1",
            tts_model_token: "tmt1",
            inference_text: "inference text",
            is_storyteller_demo: false,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: {
          inference_job_token: "ijt1",
          inference_job_token_type: "ijtt1",
        },
      });
    });

    it("failure", async () => {
      const api = new TtsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        BadInput: "error",
      });
      const response = await api.GenerateTtsAudio({
        uuid_idempotency_token: "uit1",
        tts_model_token: "tmt1",
        inference_text: "inference text",
        is_storyteller_demo: false,
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/tts/inference",
        {
          method: "POST",
          body: {
            creator_set_visibility: "public",
            uuid_idempotency_token: "uit1",
            tts_model_token: "tmt1",
            inference_text: "inference text",
            is_storyteller_demo: false,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "error",
        data: {},
      });
    });

    it("exception", async () => {
      const api = new TtsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("error"));
      const response = await api.GenerateTtsAudio({
        uuid_idempotency_token: "uit1",
        tts_model_token: "tmt1",
        inference_text: "inference text",
        is_storyteller_demo: false,
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/tts/inference",
        {
          method: "POST",
          body: {
            creator_set_visibility: "public",
            uuid_idempotency_token: "uit1",
            tts_model_token: "tmt1",
            inference_text: "inference text",
            is_storyteller_demo: false,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "unknown_error",
        data: {},
      });
    });
  });
});
