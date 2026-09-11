import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UserInfo } from "~/models";
import { Visibility } from "~/enums";
import { VideoApi } from "~/Classes/ApiManager/VideoApi";

const mockRequest = {
  disable_lcm: true,
  enable_lipsync: true,
  input_file: "input file",
  ipa_media_token: "ipa token",
  negative_prompt: "negative prompt",
  prompt: "positive prompt",
  remove_watermark: true,
  style: "anime_2_5d",
  trim_end_millis: 0,
  trim_start_millis: 0,
  use_cinematic: true,
  use_face_detailer: true,
  use_lipsync: true,
  use_strength: 0,
  use_upscaler: true,
  uuid_idempotency_token: "i token",
};

describe("VideoApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("EnqueueVideo", () => {
    it("success no visibility", async () => {
      const videoApi = new VideoApi();
      jest.spyOn(videoApi, "fetch").mockResolvedValue({
        inference_job_token: "ijt1",
        inference_job_token_type: "ijtt1",
        success: true,
      });
      const response = await videoApi.EnqueueStudio({
        enqueueVideo: mockRequest,
      });
      expect(videoApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/video/enqueue_vst",
        {
          method: "POST",
          body: {
            creator_set_visibility: "public",
            ...mockRequest,
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
      const videoApi = new VideoApi();
      jest.spyOn(videoApi, "fetch").mockResolvedValue({
        inference_job_token: "ijt1",
        inference_job_token_type: "ijtt1",
        success: true,
      });
      const response = await videoApi.EnqueueStudio({
        enqueueVideo: {
          ...mockRequest,
          creator_set_visibility: Visibility.Private,
        },
      });
      expect(videoApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/video/enqueue_vst",
        {
          method: "POST",
          body: {
            creator_set_visibility: "private",
            ...mockRequest,
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
      const videoApi = new VideoApi();
      jest.spyOn(videoApi, "fetch").mockResolvedValue({
        BadInput: "error",
      });
      const response = await videoApi.EnqueueStudio({
        enqueueVideo: mockRequest,
      });
      expect(videoApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/video/enqueue_vst",
        {
          method: "POST",
          body: {
            creator_set_visibility: "public",
            ...mockRequest,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "error",
        data: {
          inference_job_token: undefined,
          inference_job_token_type: undefined,
        },
      });
    });

    it("exception", async () => {
      const videoApi = new VideoApi();
      jest.spyOn(videoApi, "fetch").mockResolvedValue({
        BadInput: "error",
      });
      const response = await videoApi.EnqueueStudio({
        enqueueVideo: mockRequest,
      });
      expect(videoApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/video/enqueue_vst",
        {
          method: "POST",
          body: {
            creator_set_visibility: "public",
            ...mockRequest,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "error",
        data: {
          inference_job_token: undefined,
          inference_job_token_type: undefined,
        },
      });
    });
  });
});
