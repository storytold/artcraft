import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { CommentsApi } from "~/Classes/ApiManager/CommentsApi";

describe("CommentsApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("CreateComment", () => {
    it("success", async () => {
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        comment_token: "ct1",
        success: true,
      });
      const response = await api.CreateComment({
        commentMarkdown: "my comment",
        entityToken: "et1",
        entityType: "type1",
        uuidIdempotencyToken: "uuid",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/new",
        {
          method: "POST",
          body: {
            comment_markdown: "my comment",
            entity_token: "et1",
            entity_type: "type1",
            uuid_idempotency_token: "uuid",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        data: "ct1",
        success: true,
      });
    });

    it("failure", async () => {
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.CreateComment({
        commentMarkdown: "my comment",
        entityToken: "et1",
        entityType: "type1",
        uuidIdempotencyToken: "uuid",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/new",
        {
          method: "POST",
          body: {
            comment_markdown: "my comment",
            entity_token: "et1",
            entity_type: "type1",
            uuid_idempotency_token: "uuid",
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
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.CreateComment({
        commentMarkdown: "my comment",
        entityToken: "et1",
        entityType: "type1",
        uuidIdempotencyToken: "uuid",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/new",
        {
          method: "POST",
          body: {
            comment_markdown: "my comment",
            entity_token: "et1",
            entity_type: "type1",
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

  describe("DeleteComment", () => {
    it("success", async () => {
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
      });
      const response = await api.DeleteComment({
        commentToken: "ct1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/delete/ct1",
        {
          method: "POST",
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
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "bad input" });
      const response = await api.DeleteComment({
        commentToken: "ct1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/delete/ct1",
        {
          method: "POST",
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
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.DeleteComment({
        commentToken: "ct1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/delete/ct1",
        {
          method: "POST",
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

  describe("ListCommentsByEntity", () => {
    it("success", async () => {
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
        comments: ["comm1", "comm2"],
      });
      const response = await api.ListCommentsByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/list/et1/tok1",
        {
          method: "GET",
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: ["comm1", "comm2"],
      });
    });

    it("exception", async () => {
      const api = new CommentsApi();
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await api.ListCommentsByEntity({
        entityType: "et1",
        entityToken: "tok1",
      });
      expect(api.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/comments/list/et1/tok1",
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
