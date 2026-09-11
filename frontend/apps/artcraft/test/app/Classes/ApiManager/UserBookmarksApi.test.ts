import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UserBookmarksApi } from "~/Classes/ApiManager/UserBookmarksApi";

describe("UserBookmarksApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("CreateUserBookmark", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        new_bookmark_count_for_entity: 0,
        success: true,
        user_bookmark_token: "ubt1",
      });
      const response = await api.CreateUserBookmark({
        entityToken: "et1",
        entityType: "entt1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        data: {
          new_bookmark_count_for_entity: 0,
          user_bookmark_token: "ubt1",
        },
        success: true,
      });
    });

    it("failure", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.CreateUserBookmark({
        entityToken: "et1",
        entityType: "entt1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        data: {
          new_bookmark_count_for_entity: undefined,
          user_bookmark_token: undefined,
        },
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.CreateUserBookmark({
        entityToken: "et1",
        entityType: "entt1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
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

  describe("DeleteUserBookmark", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
      });
      const response = await api.DeleteUserBookmark({
        entityToken: "et1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/delete/et1",
        {
          method: "DELETE",
          body: {
            as_mod: true,
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
      });
    });

    it("failure", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.DeleteUserBookmark({
        entityToken: "et1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/delete/et1",
        {
          method: "DELETE",
          body: {
            as_mod: true,
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
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.DeleteUserBookmark({
        entityToken: "et1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/delete/et1",
        {
          method: "DELETE",
          body: {
            as_mod: true,
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

  describe("ListUserBookmarks", () => {
    it("success", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        bookmarks: [
          {
            entity_token: "string",
            entity_type: "user",
            is_bookmarked: true,
            maybe_bookmark_token: "string",
          },
        ],
        success: true,
      });
      const response = await api.ListUserBookmarks();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/batch",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: [
          {
            entity_token: "string",
            entity_type: "user",
            is_bookmarked: true,
            maybe_bookmark_token: "string",
          },
        ],
      });
    });

    it("failure", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.ListUserBookmarks();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/batch",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserBookmarksApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListUserBookmarks();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_bookmarks/batch",
        {
          method: "GET",
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
