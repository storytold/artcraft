import { ApiManager, ApiResponse, buildSessionHeaders, storeSignedSession, clearSignedSession } from "./ApiManager.js";
import { UserInfo } from "./models/Users.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

interface SignupRequest {
  username: string;
  email_address: string;
  password: string;
  password_confirmation: string;
  signup_source?: string;
  maybe_referral_url?: string;
  maybe_landing_url?: string;
  maybe_referral_username?: string;
  maybe_referral_code?: string;
}

export class UsersApi extends ApiManager {
  private async authFetch<B, T>(
    endpoint: string,
    {
      method,
      body,
    }: {
      method: string;
      body?: B;
    },
  ): Promise<T> {
    const bodyInString = JSON.stringify(body);

    const response = await fetch(endpoint, {
      method,
      headers: buildSessionHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      credentials: "include",
      body: bodyInString,
    });

    const text = await response.text();
    try {
      const responseData = JSON.parse(text);
      return responseData as T;
    } catch (e) {
      console.error("Failed to parse response as JSON:", text);
      throw new Error(text || `Request failed with status ${response.status}`);
    }
  }

  public GetSession(): Promise<
    ApiResponse<{
      loggedIn: boolean;
      user?: UserInfo;
      onboarding?: {
        email_not_set: boolean;
        email_not_confirmed: boolean;
        password_not_set: boolean;
        username_not_customized: boolean;
      };
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/session`;
    return this.get<{
      success: boolean;
      logged_in: boolean;
      user?: UserInfo & {
        onboarding?: {
          email_not_set: boolean;
          email_not_confirmed: boolean;
          password_not_set: boolean;
          username_not_customized: boolean;
        };
      };
      error_message?: string;
    }>({ endpoint: endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          loggedIn: response.logged_in,
          user: response.user,
          onboarding: response.user?.onboarding,
        },
      }))
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public GetUserProfile(username: string): Promise<
    ApiResponse<{
      user?: UserInfo;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/${username}/profile`;
    console.log("endpoint", endpoint);
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
          errorMessage: err.message,
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
    console.log("libs/api - Logging in with usernameOrEmail:", usernameOrEmail);
    const endpoint = `${this.getApiSchemeAndHost()}/v1/login`;
    console.log("libs/api - Login endpoint", endpoint);
    const body = {
      username_or_email: usernameOrEmail,
      password: password,
    };

    try {
      const response = await this.authFetch<
        { username_or_email: string; password: string },
        {
          success: boolean;
          signed_session?: string;
          error_message?: string;
          error_type?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });
      if (response.success && response.signed_session) {
        storeSignedSession(response.signed_session);
      }
      return {
        success: response.success,
        data: response.success
          ? { signedSession: response.signed_session }
          : undefined,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public Logout(): Promise<ApiResponse<null>> {
    clearSignedSession();
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

  public async LogWebReferral({
    maybeReferralUrl,
  }: {
    maybeReferralUrl?: string;
  }): Promise<ApiResponse<{ success: boolean }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/web_referrals/record`;
    const body = {
      maybe_referral_url: maybeReferralUrl ?? null,
    };

    try {
      const response = await this.authFetch<
        { maybe_referral_url: string | null },
        { success: boolean }
      >(endpoint, {
        method: "POST",
        body,
      });
      return { success: response.success };
    } catch {
      return { success: false };
    }
  }

  public async Signup({
    username,
    email,
    password,
    passwordConfirmation,
    signupSource,
    maybeReferralUrl,
    maybeLandingUrl,
    maybeReferralUsername,
    maybeReferralCode,
  }: {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    signupSource?: string;
    maybeReferralUrl?: string;
    maybeLandingUrl?: string;
    maybeReferralUsername?: string;
    maybeReferralCode?: string;
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
    if (maybeReferralUrl) {
      body.maybe_referral_url = maybeReferralUrl;
    }
    if (maybeLandingUrl) {
      body.maybe_landing_url = maybeLandingUrl;
    }
    if (maybeReferralUsername) {
      body.maybe_referral_username = maybeReferralUsername;
    }
    if (maybeReferralCode) {
      body.maybe_referral_code = maybeReferralCode;
    }

    try {
      const response = await this.authFetch<
        SignupRequest,
        {
          success: boolean;
          signed_session?: string;
          error_fields?: Record<string, string>;
          error_message?: string;
          error_type?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      if (response.success && response.signed_session) {
        storeSignedSession(response.signed_session);
      }
      return {
        success: response.success,
        data: response.success
          ? { signedSession: response.signed_session }
          : undefined,
        errorMessage:
          response.error_message ||
          Object.values(response.error_fields ?? {}).join(", "),
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async GoogleSSO({
    credential,
    maybeReferralUrl,
    maybeLandingUrl,
    maybeReferralUsername,
    maybeReferralCode,
  }: {
    credential: string;
    maybeReferralUrl?: string;
    maybeLandingUrl?: string;
    maybeReferralUsername?: string;
    maybeReferralCode?: string;
  }): Promise<ApiResponse<{ usernameNotYetCustomized?: boolean }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/accounts/google_sso`;
    const body: {
      google_credential: string;
      maybe_referral_url?: string;
      maybe_landing_url?: string;
      maybe_referral_username?: string;
      maybe_referral_code?: string;
    } = {
      google_credential: credential,
    };
    if (maybeReferralUrl) {
      body.maybe_referral_url = maybeReferralUrl;
    }
    if (maybeLandingUrl) {
      body.maybe_landing_url = maybeLandingUrl;
    }
    if (maybeReferralUsername) {
      body.maybe_referral_username = maybeReferralUsername;
    }
    if (maybeReferralCode) {
      body.maybe_referral_code = maybeReferralCode;
    }

    try {
      const response = await this.authFetch<
        {
          google_credential: string;
          maybe_referral_url?: string;
          maybe_landing_url?: string;
          maybe_referral_username?: string;
          maybe_referral_code?: string;
        },
        {
          success: boolean;
          signed_session?: string;
          username_not_yet_customized?: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      // Store the signed session so auth survives where the cross-domain
      // cookie is blocked (e.g. Safari ITP) — mirrors Login/Signup.
      if (response.success && response.signed_session) {
        storeSignedSession(response.signed_session);
      }

      return {
        success: response.success,
        data: response.success
          ? { usernameNotYetCustomized: response.username_not_yet_customized }
          : undefined,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async ChangePassword({
    password,
    passwordConfirmation,
  }: {
    password: string;
    passwordConfirmation: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/change_password`;
    const body = {
      password,
      password_confirmation: passwordConfirmation,
    };

    try {
      const response = await this.authFetch<
        { password: string; password_confirmation: string },
        {
          success: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async EditEmail({
    emailAddress,
  }: {
    emailAddress: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/edit_email`;
    const body = {
      email_address: emailAddress,
    };

    try {
      const response = await this.authFetch<
        { email_address: string },
        {
          success: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }

  public async EditUsername({
    displayName,
  }: {
    displayName: string;
  }): Promise<ApiResponse<null>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user/edit_username`;
    const body = {
      display_name: displayName,
    };

    try {
      const response = await this.authFetch<
        { display_name: string },
        {
          success: boolean;
          error_message?: string;
        }
      >(endpoint, {
        method: "POST",
        body: body,
      });

      return {
        success: response.success,
        errorMessage: response.error_message,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message,
      };
    }
  }
}

(window as any).UsersApi = new UsersApi();
