import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { MediaUploadApi } from "~/Classes/ApiManager/MediaUploadApi";
import { Visibility } from "~/enums";
import { UserInfo } from "~/models";

EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });

describe("MediaUploadApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
  });

  describe("run tests", () => {
    const api = new MediaUploadApi();
    [
      {
        name: "UploadAudio",
        function: api.UploadAudio.bind(api),
        endpoint: "http://localhost:3000/v1/media_files/upload/audio",
        is_intermediate_system_file: false,
        params: {
          maybe_title: "title",
          maybe_visibility: Visibility.Private,
        },
      },
      {
        name: "UploadImage",
        function: api.UploadImage.bind(api),
        endpoint: "http://localhost:3000/v1/media_files/upload/image",
        is_intermediate_system_file: true,
        params: {
          maybe_title: "title",
          maybe_visibility: Visibility.Private,
        },
      },
      {
        name: "UploadNewEngineAsset",
        function: api.UploadNewEngineAsset.bind(api),
        endpoint:
          "http://localhost:3000/v1/media_files/upload/new_engine_asset",
        is_intermediate_system_file: false,
        params: {
          maybe_title: "title",
          maybe_visibility: Visibility.Private,
          maybe_animation_type: "animate",
          maybe_duration_millis: 55,
        },
      },
      {
        name: "UploadNewScene",
        function: api.UploadNewScene.bind(api),
        endpoint: "http://localhost:3000/v1/media_files/upload/new_scene",
        is_intermediate_system_file: false,
        params: {
          maybe_title: "title",
          maybe_visibility: Visibility.Private,
        },
      },
      {
        name: "UploadNewVideo",
        function: api.UploadNewVideo.bind(api),
        endpoint: "http://localhost:3000/v1/media_files/upload/new_video",
        is_intermediate_system_file: true,
        params: {
          maybe_title: "title",
          maybe_visibility: Visibility.Private,
          maybe_style_name: "style",
          maybe_scene_source_media_file_token: "ssmft1",
        },
      },
      {
        name: "UploadPmx",
        function: api.UploadPmx.bind(api),
        endpoint: "http://localhost:3000/v1/media_files/upload/pmx",
        is_intermediate_system_file: true,
        params: {
          engine_category: "ec1",
          maybe_animation_type: "animate",
          maybe_duration_millis: 77,
          maybe_title: "a title",
          maybe_visibility: Visibility.Private,
        },
      },
    ].forEach((testMethod) => {
      describe(testMethod.name, () => {
        afterEach(() => {
          jest.clearAllMocks();
        });

        it("no parameters", async () => {
          jest.spyOn(api, "fetch").mockResolvedValueOnce({
            media_file_token: "mft1",
            success: true,
          });
          const blob = new Blob(["my blob data"]);
          const uuid = "some uuid";
          const response = await testMethod.function({
            blob: blob,
            fileName: "some file name",
            uuid,
          });
          const formData = new FormData();
          formData.append("uuid_idempotency_token", uuid);
          Object.entries({
            ...(testMethod.is_intermediate_system_file
              ? { is_intermediate_system_file: "true" }
              : {}),
            maybe_visibility: Visibility.Public,
          }).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append("file", blob, "some file name");
          expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
            method: "POST",
            body: formData,
          });
          expect(response).toEqual({
            data: "mft1",
            success: true,
            errorMessage: undefined,
          });
        });

        it("all parameters", async () => {
          jest.spyOn(api, "fetch").mockResolvedValueOnce({
            media_file_token: "mft1",
            success: true,
          });
          const blob = new Blob(["my blob data"]);
          const uuid = "some uuid";
          const response = await testMethod.function({
            blob: blob,
            fileName: "some file name",
            uuid,
            ...testMethod.params,
          });
          const formData = new FormData();
          formData.append("uuid_idempotency_token", uuid);
          Object.entries({
            ...(testMethod.is_intermediate_system_file
              ? { is_intermediate_system_file: "true" }
              : {}),
            ...testMethod.params,
          }).forEach(([key, value]) => {
            if (value !== undefined) {
              formData.append(key, value.toString());
            }
          });
          formData.append("file", blob, "some file name");
          expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
            method: "POST",
            body: formData,
          });
          expect(response).toEqual({
            data: "mft1",
            success: true,
            errorMessage: undefined,
          });
        });

        it("failure", async () => {
          jest.spyOn(api, "fetch").mockResolvedValueOnce({
            BadInput: "error error",
          });
          const blob = new Blob(["my blob data"]);
          const uuid = "some uuid";
          const response = await testMethod.function({
            blob: blob,
            fileName: "some file name",
            uuid,
          });
          const formData = new FormData();
          formData.append("uuid_idempotency_token", uuid);
          Object.entries({
            ...(testMethod.is_intermediate_system_file
              ? { is_intermediate_system_file: "true" }
              : {}),
            maybe_visibility: Visibility.Public,
          }).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append("file", blob, "some file name");
          expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
            method: "POST",
            body: formData,
          });
          expect(response).toEqual({
            data: undefined,
            success: false,
            errorMessage: "error error",
          });
        });

        it("exception", async () => {
          jest.spyOn(api, "fetch").mockRejectedValue(new Error("error error"));
          const blob = new Blob(["my blob data"]);
          const uuid = "some uuid";
          const response = await testMethod.function({
            blob: blob,
            fileName: "some file name",
            uuid,
          });
          const formData = new FormData();
          formData.append("uuid_idempotency_token", uuid);
          Object.entries({
            ...(testMethod.is_intermediate_system_file
              ? { is_intermediate_system_file: "true" }
              : {}),
            maybe_visibility: Visibility.Public,
          }).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append("file", blob, "some file name");
          expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
            method: "POST",
            body: formData,
          });
          expect(response).toEqual({
            data: undefined,
            success: false,
            errorMessage: "error error",
          });
        });
      });
    });
  });

  describe("UploadSavedScene", () => {
    it("success", async () => {
      const api = new MediaUploadApi();
      jest.spyOn(api, "fetch").mockResolvedValueOnce({
        media_file_token: "mft1",
        success: true,
      });
      const blob = new Blob(["my blob data"]);
      const uuid = "some uuid";
      const response = await api.UploadSavedScene({
        blob: blob,
        fileName: "some file name",
        uuid,
        mediaToken: "mt1",
      });
      const formData = new FormData();
      formData.append("uuid_idempotency_token", uuid);
      formData.append("file", blob, "some file name");
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/media_files/upload/saved_scene/mt1",
        {
          method: "POST",
          body: formData,
        },
      );
      expect(response).toEqual({
        data: "mft1",
        success: true,
        errorMessage: undefined,
      });
    });

    it("failure", async () => {
      const api = new MediaUploadApi();
      jest.spyOn(api, "fetch").mockResolvedValueOnce({
        BadInput: "error error",
      });
      const blob = new Blob(["my blob data"]);
      const uuid = "some uuid";
      const response = await api.UploadSavedScene({
        blob: blob,
        fileName: "some file name",
        uuid,
        mediaToken: "mt1",
      });
      const formData = new FormData();
      formData.append("uuid_idempotency_token", uuid);
      formData.append("file", blob, "some file name");
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/media_files/upload/saved_scene/mt1",
        {
          method: "POST",
          body: formData,
        },
      );
      expect(response).toEqual({
        data: undefined,
        success: false,
        errorMessage: "error error",
      });
    });

    it("exception", async () => {
      const api = new MediaUploadApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("error error"));
      const blob = new Blob(["my blob data"]);
      const uuid = "some uuid";
      const response = await api.UploadSavedScene({
        blob: blob,
        fileName: "some file name",
        uuid,
        mediaToken: "mt1",
      });
      const formData = new FormData();
      formData.append("uuid_idempotency_token", uuid);
      formData.append("file", blob, "some file name");
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/media_files/upload/saved_scene/mt1",
        {
          method: "POST",
          body: formData,
        },
      );
      expect(response).toEqual({
        data: undefined,
        success: false,
        errorMessage: "error error",
      });
    });
  });
});
