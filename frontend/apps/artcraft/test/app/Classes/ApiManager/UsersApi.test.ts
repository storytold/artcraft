import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UsersApi } from "~/Classes/ApiManager/UsersApi";
import { UserInfo } from "~/models";

describe("UsersApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("Login", () => {
    it("failing parameters", async () => {
      const usersApi = new UsersApi();
      jest.spyOn(usersApi, "fetch").mockResolvedValue({
        success: false,
        error_message: "error",
      });
      const response = await usersApi.Login({
        usernameOrEmail: "un1@example.com",
        password: "pass word",
      });
      expect(usersApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/login",
        {
          method: "POST",
          body: {
            username_or_email: "un1@example.com",
            password: "pass word",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: false,
        data: {
          signedSession: undefined,
        },
        errorMessage: "error",
      });
    });

    it("success parameters", async () => {
      const usersApi = new UsersApi();
      jest.spyOn(usersApi, "fetch").mockResolvedValue({
        success: true,
        signed_session: "signed session",
      });
      const response = await usersApi.Login({
        usernameOrEmail: "un1@example.com",
        password: "pass word",
      });
      expect(usersApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/login",
        {
          method: "POST",
          body: {
            username_or_email: "un1@example.com",
            password: "pass word",
          },
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: {
          signedSession: "signed session",
        },
        errorReason: undefined,
      });
    });
  });
});
