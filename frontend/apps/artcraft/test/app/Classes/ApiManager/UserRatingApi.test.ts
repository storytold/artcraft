import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UserRatingApi } from "~/Classes/ApiManager/UserRatingsApi";

describe("UserBookmarksApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("PostUserRating", () => {
    it("success", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        new_positive_rating_count_for_entity: 22,
        success: true,
      });
      const response = await api.PostUserRating({
        entityToken: "et1",
        entityType: "entt1",
        ratingValue: "rate1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/rate",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
            rating_value: "rate1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        data: 22,
        success: true,
        errorMessage: undefined,
      });
    });

    it("failure", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.PostUserRating({
        entityToken: "et1",
        entityType: "entt1",
        ratingValue: "rate1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/rate",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
            rating_value: "rate1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        data: undefined,
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.PostUserRating({
        entityToken: "et1",
        entityType: "entt1",
        ratingValue: "rate1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/rate",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "entt1",
            rating_value: "rate1",
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

  describe("ListUserRatings", () => {
    it("success", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        ratings: [
          {
            entity_token: "string",
            entity_type: "media_file",
            rating_value: "neutral",
          },
        ],
        success: true,
      });
      const response = await api.ListUserRatings();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/batch",
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
            entity_type: "media_file",
            rating_value: "neutral",
          },
        ],
        errorMessage: undefined,
      });
    });

    it("failure", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.ListUserRatings();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/batch",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        data: undefined,
        errorMessage: "bad input",
      });
    });

    it("exception", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListUserRatings();
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/batch",
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

  describe("ListUserRatingsByEntity", () => {
    it("success", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        maybe_rating_value: "neutral",
        success: true,
      });
      const response = await api.ListUserRatingByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/view/et1/tok1",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: "neutral",
      });
    });

    it("failure", async () => {
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.ListUserRatingByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/view/et1/tok1",
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
      const api = new UserRatingApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListUserRatingByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/user_rating/view/et1/tok1",
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
