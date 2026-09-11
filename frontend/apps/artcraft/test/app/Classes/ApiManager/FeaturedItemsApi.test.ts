import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { FeaturedItemsApi } from "~/Classes/ApiManager/FeaturedItemsApi";

describe("FeaturedItemsApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("CreateFeaturedItem", () => {
    it("success", async () => {
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        is_featured: true,
        success: true,
      });
      const response = await api.CreateFeaturedItem({
        entityToken: "et1",
        entityType: "type1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "type1",
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
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.CreateFeaturedItem({
        entityToken: "et1",
        entityType: "type1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "type1",
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
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.CreateFeaturedItem({
        entityToken: "et1",
        entityType: "type1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/create",
        {
          method: "POST",
          body: {
            entity_token: "et1",
            entity_type: "type1",
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

  describe("DeleteFeaturedItem", () => {
    it("success", async () => {
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
      });
      const response = await api.DeleteFeaturedItem({
        entityToken: "et1",
        entityType: "type1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/delete",
        {
          method: "DELETE",
          body: {
            entity_token: "et1",
            entity_type: "type1",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
      });
    });

    it("failure", async () => {
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.DeleteFeaturedItem({
        entityToken: "et1",
        entityType: "type1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/delete",
        {
          method: "DELETE",
          body: {
            entity_token: "et1",
            entity_type: "type1",
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
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.DeleteFeaturedItem({
        entityToken: "et1",
        entityType: "type1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/delete",
        {
          method: "DELETE",
          body: {
            entity_token: "et1",
            entity_type: "type1",
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

  describe("CheckFeaturedItem", () => {
    it("success", async () => {
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        is_featured: true,
        success: true,
      });
      const response = await api.CheckFeaturedItem({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/is_featured/et1/tok1",
        {
          method: "POST",
          body: undefined,
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: true,
        errorMessage: undefined,
      });
    });

    it("failure", async () => {
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.CheckFeaturedItem({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/is_featured/et1/tok1",
        {
          method: "POST",
          body: undefined,
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
      const api = new FeaturedItemsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.CheckFeaturedItem({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/featured_item/is_featured/et1/tok1",
        {
          method: "POST",
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
