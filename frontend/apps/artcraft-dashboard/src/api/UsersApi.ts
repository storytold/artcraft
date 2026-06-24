import { ApiManager, type ApiResponse } from "./ApiManager";
import type { UserInfo, AppStateResponse } from "@/types";

interface SignupRequest {
  username: string;
  email_address: string;
  password: string;
  password_confirmation: string;
  signup_source?: string;
}

export interface OnboardingData {
  email_not_set: boolean;
  email_not_confirmed: boolean;
  password_not_set: boolean;
  username_not_customized: boolean;
}

export class UsersApi extends ApiManager {
  public GetAppState(): Promise<ApiResponse<AppStateResponse>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/app_state`;
    return this.get<AppStateResponse>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public GetUserProfile(username: string): Promise<
    ApiResponse<{
      user?: UserInfo;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/${username}/profile`;
    return this.get<{
      success: boolean;
      user?: {
        user_token: string;
        username: string;
        display_name: string;
        email_gravatar_hash: string;
        disable_gravatar: boolean;
        created_at: string;
        [key: string]: any;
      };
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          user: response.user
            ? {
                id: response.user.user_token,
                username: response.user.username,
                display_name: response.user.display_name,
                email: "",
                gravatar_hash: response.user.email_gravatar_hash,
                disable_gravatar: response.user.disable_gravatar,
                created_at: response.user.created_at,
              }
            : undefined,
        },
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
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
      password,
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
      endpoint,
      body,
    })
      .then((response) => ({
        success: response.success,
        data: { signedSession: response.signed_session },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public Logout(): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/logout`;
    return this.post<null, { success: boolean; error_message?: string }>({
      endpoint,
    })
      .then((response) => ({
        success: response.success,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
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
    const body: SignupRequest = {
      email_address: email,
      password,
      password_confirmation: passwordConfirmation,
      username,
    };
    if (signupSource) {
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
      endpoint,
      body,
    })
      .then((response) => ({
        success: response.success,
        data: { signedSession: response.signed_session },
        errorMessage:
          response.error_message ||
          Object.values(response.error_fields ?? {}).join(", "),
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async RequestPasswordReset({
    email,
  }: {
    email: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/request_password_reset`;
    return await this.post<
      { email: string },
      { success: boolean; error_message?: string }
    >({
      endpoint,
      body: { email },
    })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ResetPassword({
    token,
    password,
    passwordConfirmation,
  }: {
    token: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/reset_password`;
    return await this.post<
      { token: string; password: string; password_confirmation: string },
      { success: boolean; error_message?: string }
    >({
      endpoint,
      body: {
        token,
        password,
        password_confirmation: passwordConfirmation,
      },
    })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ChangePassword({
    password,
    passwordConfirmation,
  }: {
    password: string;
    passwordConfirmation: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/change_password`;
    return await this.post<
      { password: string; password_confirmation: string },
      { success: boolean; error_message?: string }
    >({
      endpoint,
      body: {
        password,
        password_confirmation: passwordConfirmation,
      },
    })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async EditEmail({
    emailAddress,
  }: {
    emailAddress: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/edit_email`;
    return await this.post<
      { email_address: string },
      { success: boolean; error_message?: string }
    >({
      endpoint,
      body: { email_address: emailAddress },
    })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async EditUsername({
    displayName,
  }: {
    displayName: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/edit_username`;
    return await this.post<
      { display_name: string },
      { success: boolean; error_message?: string }
    >({
      endpoint,
      body: { display_name: displayName },
    })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
