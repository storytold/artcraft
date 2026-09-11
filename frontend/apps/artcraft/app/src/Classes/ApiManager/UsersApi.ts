import { ApiManager, ApiResponse } from "./ApiManager";
import { UserInfo } from "~/models";

interface SignupRequest {
  username: string;
  email_address: string;
  password: string;
  password_confirmation: string;
  signup_source?: string;
};

export class UsersApi extends ApiManager {
  public GetSession(): Promise<
    ApiResponse<{
      loggedIn: boolean;
      user?: UserInfo;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/session`;
    return this.get<{
      success: boolean;
      logged_in: boolean;
      user?: UserInfo;
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          loggedIn: response.logged_in,
          user: response.user,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.mesasge,
        };
      });
  }

  public GetUserProfile(username: string): Promise<
    ApiResponse<{
      user?: UserInfo;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/${username}/profile`;
    return this.get<{
      success: boolean;
      user?: UserInfo;
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          user: response.user,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          error_message: err.message,
        };
      });
  }

  public async Login({
    usernameOrEmail,
    password,
  }: {
    usernameOrEmail: string;
    password: string;
  }): Promise<ApiResponse<{ signedSession?: string }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/login`;
    const body = {
      username_or_email: usernameOrEmail,
      password: password,
    };
    return await this.post<
      { username_or_email: string; password: string },
      {
        success: boolean;
        signed_session?: string;
        error_message?: string;
        error_type?: string;
      }
    >({
      endpoint: endpoint,
      body: body,
    })
      .then((response) => ({
        success: response.success,
        data: { signedSession: response.signed_session },
        errorMessage: response.error_message,
      }))
      .catch((err) => {
        return {
          success: false,
          error_message: err.message,
        };
      });
  }

  public Logout(): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/logout`;
    return this.post<null, { success: boolean; error_message?: string }>({
      endpoint: endpoint,
    })
      .then((response) => ({
        success: response.success,
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async Signup({
    username,
    email,
    password,
    passwordConfirmation,
    signupSource,
  }: {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    signupSource?: string;
  }): Promise<ApiResponse<{ signedSession?: string }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/create_account`;
    let body: SignupRequest = {
      email_address: email,
      password,
      password_confirmation: passwordConfirmation,
      username,
    };
    if (!!signupSource) {
      body.signup_source = signupSource;
    }
    return await this.post<
      SignupRequest,
      {
        success: boolean;
        signed_session?: string;
        error_fields?: Record<string, string>;
        error_message?: string;
        error_type?: string;
      }
    >({
      endpoint: endpoint,
      body: body,
    })
      .then((response) => {
        return {
          success: response.success,
          data: { signedSession: response.signed_session },
          errorMessage: Object.values(response.error_fields ?? {}).join(","),
        };
      })
      .catch((err) => {
        return {
          success: false,
          error_message: err.message,
        };
      });
  }
}
