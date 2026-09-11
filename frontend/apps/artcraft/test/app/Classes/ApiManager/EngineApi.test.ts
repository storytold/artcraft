import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { JobsApi } from "~/Classes/ApiManager/JobsApi";
import { UserInfo } from "~/models";
import { EngineApi } from "~/Classes/ApiManager/EngineApi";

describe("EngineApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("FetchRecentJobs", () => {
    it("success", async () => {
      const api = new EngineApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
        inference_job_token: "ijt1",
      });
      const response = await api.ConvertTbxToGltf({
        mediaFileToken: "mft1",
        uuidIdempotencyToken: "uuid",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/conversion/enqueue_fbx_to_gltf",
        {
          method: "POST",
          body: {
            media_file_token: "mft1",
            uuid_idempotency_token: "uuid",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: "ijt1",
      });
    });

    it("failure", async () => {
      const api = new EngineApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.ConvertTbxToGltf({
        mediaFileToken: "mft1",
        uuidIdempotencyToken: "uuid",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/conversion/enqueue_fbx_to_gltf",
        {
          method: "POST",
          body: {
            media_file_token: "mft1",
            uuid_idempotency_token: "uuid",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new EngineApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ConvertTbxToGltf({
        mediaFileToken: "mft1",
        uuidIdempotencyToken: "uuid",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/conversion/enqueue_fbx_to_gltf",
        {
          method: "POST",
          body: {
            media_file_token: "mft1",
            uuid_idempotency_token: "uuid",
          },
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
