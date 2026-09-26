import { ApiManager, storeSignedSession } from "./ApiManager.js";

export interface LoginChallenge {
  success: boolean;
  device_token: string;
  verification_url: string;
  confirmation_code: string;
  expires_at: string;
  poll_interval_seconds: number;
}

export interface LoginChallengeResult {
  success: boolean;
  // Kept open to future values: callers must fail closed on an unknown state.
  status: string;
  maybe_failure_type: string | null;
  maybe_signed_session?: string;
}

export interface LoginChallengeReview extends LoginChallengeResult {
  confirmation_code: string;
  requesting_ip: string;
  expires_at: string;
  username: string;
}

export class LoginChallengesApi extends ApiManager {
  create(): Promise<LoginChallenge> {
    return this.request("create", {});
  }

  review(approvalToken: string): Promise<LoginChallengeReview> {
    return this.request("review", { approval_token: approvalToken });
  }

  decide(approvalToken: string, approve: boolean): Promise<LoginChallengeResult> {
    return this.request("decide", { approval_token: approvalToken, approve });
  }

  poll(deviceToken: string): Promise<LoginChallengeResult> {
    return this.request("poll", { device_token: deviceToken });
  }

  acceptSession(result: LoginChallengeResult): void {
    if (result.status !== "redeemed" || !result.success || !result.maybe_signed_session) {
      throw new Error("The desktop login has not completed.");
    }
    storeSignedSession(result.maybe_signed_session);
  }

  private request<T>(action: string, body: Record<string, unknown>): Promise<T> {
    return this.fetch(`${this.getApiSchemeAndHost()}/v1/login_challenges/${action}`, {
      method: "POST", body,
    });
  }
}
