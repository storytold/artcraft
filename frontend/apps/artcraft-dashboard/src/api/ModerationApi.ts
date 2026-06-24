import { ApiManager, type ApiResponse } from "./ApiManager";
import type {
  Wallet,
  WalletWithOwner,
  WalletLedgerEntry,
  WalletLedgerEntryWithWallet,
  UserJob,
  SignupUser,
  SubscriberUser,
  ImpersonationRequest,
  StaffAuditLog,
  ModerationJob,
  DebugLog,
  UserEmailChange,
} from "@/types";

export interface FeatureFlagDescriptor {
  key: string;
  full_name: string;
  description: string;
}

export interface UserFeatureFlagsResponse {
  user_token: string;
  username: string;
  display_name: string;
  feature_flags: string[];
}

export type EditUserFeatureFlagsAction =
  | { AddFlags: { flags: string[] } }
  | { RemoveFlags: { flags: string[] } }
  | { KeepFlags: { flags: string[] } }
  | { SetExactFlags: { flags: string[] } }
  | "ClearAllFlags";

export interface UserReferralInvitedUser {
  token: string;
  username: string;
  display_name: string;
  email_address: string;
}

export interface UserReferralReferrerUser {
  token: string;
  username: string;
  display_name: string;
}

export interface UserReferralListItem {
  created_at: string;
  invited_user: UserReferralInvitedUser;
  referrer_user: UserReferralReferrerUser;
  maybe_landing_url: string | null;
  maybe_referral_url: string | null;
  maybe_referral_code_token: string | null;
}

/** Which table the customer id was found in. */
export type ModeratorStripeCustomerIdSource = "customer_link" | "subscription";

export interface ModeratorUserStripeCustomerIdEntry {
  stripe_customer_id: string;
  payments_namespace: string;
  source: ModeratorStripeCustomerIdSource;
}

export interface ModeratorUserLookupResponse {
  display_name: string;
  email_address: string;
  email_confirmed: boolean;
  email_gravatar_hash: string;
  email_is_synthetic: boolean;
  ip_address_creation: string;
  ip_address_last_login: string;
  is_banned: boolean;
  is_temporary: boolean;
  is_without_password: boolean;
  maybe_avatar_media_file_token?: string;
  created_at?: string;
  token: string;
  username: string;
  username_is_generated: boolean;
  username_is_not_customized: boolean;
}

export class ModerationApi extends ApiManager {
  public async UserLookup(
    search: string,
  ): Promise<ApiResponse<{ maybe_user?: ModeratorUserLookupResponse }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/users/lookup`;
    return await this.post<
      { search: string },
      {
        success: boolean;
        maybe_user?: ModeratorUserLookupResponse;
        error_message?: string;
      }
    >({
      endpoint,
      body: { search },
    })
      .then((response) => ({
        success: response.success,
        data: {
          maybe_user: response.maybe_user,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async LookupByStripeCustomerId(stripe_customer_id: string): Promise<
    ApiResponse<{
      users: Array<{
        display_name: string;
        email_address: string;
        maybe_stripe_subscription_id?: string | null;
        subscription_namespace: string;
        token: string;
        username: string;
      }>;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/users/lookup_by_stripe_customer_id`;
    return await this.post<
      { stripe_customer_id: string },
      {
        success: boolean;
        users: Array<{
          display_name: string;
          email_address: string;
          maybe_stripe_subscription_id?: string | null;
          subscription_namespace: string;
          token: string;
          username: string;
        }>;
        error_message?: string;
      }
    >({
      endpoint,
      body: { stripe_customer_id },
    })
      .then((response) => ({
        success: response.success,
        data: {
          users: response.users || [],
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async GetUserStripeCustomerIds(
    user_token: string,
  ): Promise<
    ApiResponse<{ customer_ids: ModeratorUserStripeCustomerIdEntry[] }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_stripe_data/${encodeURIComponent(user_token)}/customer_ids`;
    return await this.get<{
      success: boolean;
      customer_ids: ModeratorUserStripeCustomerIdEntry[];
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { customer_ids: response.customer_ids || [] },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ImpersonateUser(params: {
    username?: string;
    user_token?: string;
    email_address?: string;
    username_email_or_token?: string;
  }): Promise<ApiResponse<{ password_token: string }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_sessions/impersonate`;
    return await this.post<
      typeof params,
      {
        success: boolean;
        password_token?: string;
        error_message?: string;
      }
    >({
      endpoint,
      body: params,
    })
      .then((response) => ({
        success: response.success,
        data: response.password_token
          ? { password_token: response.password_token }
          : undefined,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async SendAlert(params: {
    title?: string | null;
    description?: string | null;
    urgency?: "high" | "medium" | "low" | null;
  }): Promise<ApiResponse<void>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/alerts/send`;
    return await this.post<
      typeof params,
      { success: boolean; error_message?: string }
    >({ endpoint, body: params })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ManageUserBan(params: {
    username: string;
    is_banned: boolean;
    mod_notes: string;
  }): Promise<ApiResponse<void>> {
    const endpoint = `${this.getApiSchemeAndHost()}/moderation/user_bans/manage_ban`;
    return await this.post<
      typeof params,
      { success: boolean; error_message?: string }
    >({ endpoint, body: params })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListStaffAuditLogs(
    cursor?: string | null,
    limit?: number,
  ): Promise<
    ApiResponse<{
      audit_logs: StaffAuditLog[];
      next_cursor: string | null;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/staff_audit_logs/list`;
    return await this.get<{
      success: boolean;
      audit_logs: StaffAuditLog[];
      maybe_cursor: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        cursor: cursor ?? undefined,
        limit,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          audit_logs: response.audit_logs || [],
          next_cursor: response.maybe_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListAllImpersonationRequests(
    cursor?: string | null,
    limit?: number,
  ): Promise<
    ApiResponse<{
      impersonation_requests: ImpersonationRequest[];
      next_cursor: string | null;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_sessions/impersonation_requests/list`;
    return await this.get<{
      success: boolean;
      impersonation_requests: ImpersonationRequest[];
      maybe_cursor: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        cursor: cursor ?? undefined,
        limit,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          impersonation_requests: response.impersonation_requests || [],
          next_cursor: response.maybe_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserImpersonationRequests(
    user_token: string,
    cursor?: string | null,
    limit?: number,
  ): Promise<
    ApiResponse<{
      impersonation_requests: ImpersonationRequest[];
      next_cursor: string | null;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_sessions/impersonation_requests/user/${user_token}`;
    return await this.get<{
      success: boolean;
      impersonation_requests: ImpersonationRequest[];
      maybe_cursor: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        cursor: cursor ?? undefined,
        limit,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          impersonation_requests: response.impersonation_requests || [],
          next_cursor: response.maybe_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserWallets(
    user_token: string,
  ): Promise<ApiResponse<{ wallets: Wallet[] }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/wallets/user/${user_token}/list`;
    return await this.get<{
      success: boolean;
      wallets: Wallet[];
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { wallets: response.wallets || [] },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async GetWallet(
    wallet_token: string,
  ): Promise<ApiResponse<{ maybe_wallet: WalletWithOwner | null }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/wallet/${wallet_token}`;
    return await this.get<{
      success: boolean;
      maybe_wallet: WalletWithOwner | null;
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { maybe_wallet: response.maybe_wallet },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async AddBankedBalance(
    wallet_token: string,
    credits: number,
  ): Promise<ApiResponse<void>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/wallet/${wallet_token}/add_banked_balance`;
    return await this.post<
      { credits: number },
      { success: boolean; error_message?: string }
    >({ endpoint, body: { credits } })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListWalletLedgerEntries(
    wallet_token: string,
  ): Promise<ApiResponse<{ entries: WalletLedgerEntryWithWallet[] }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/wallet_ledger_entries/wallet/${wallet_token}/list`;
    return await this.get<{
      success: boolean;
      entries: WalletLedgerEntryWithWallet[];
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { entries: response.entries || [] },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async GetWalletLedgerEntry(
    wallet_ledger_entry_token: string,
  ): Promise<ApiResponse<{ maybe_entry: WalletLedgerEntry | null }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/wallet_ledger_entry/${wallet_ledger_entry_token}`;
    return await this.get<{
      success: boolean;
      maybe_entry: WalletLedgerEntry | null;
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { maybe_entry: response.maybe_entry },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async CreateWalletForUser(
    user_token: string,
    payments_namespace?: string,
  ): Promise<ApiResponse<void>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/wallet/create_for_user`;
    return await this.post<
      { user_token: string; payments_namespace?: string },
      { success: boolean; error_message?: string }
    >({
      endpoint,
      body: { user_token, payments_namespace },
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

  public async GetJobByToken(
    job_token: string,
  ): Promise<ApiResponse<{ maybe_job: ModerationJob | null }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/job/${encodeURIComponent(job_token)}`;
    return await this.get<{
      success: boolean;
      job?: ModerationJob | null;
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { maybe_job: response.job ?? null },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListDebugLogs(
    event_token: string,
    limit?: number,
  ): Promise<ApiResponse<{ debug_logs: DebugLog[] }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/debug_logs/list/${encodeURIComponent(event_token)}`;
    return await this.get<{
      success: boolean;
      debug_logs: DebugLog[];
      error_message?: string;
    }>({
      endpoint,
      query: { limit },
    })
      .then((response) => ({
        success: response.success,
        data: { debug_logs: response.debug_logs || [] },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserJobs(
    user_token: string,
  ): Promise<ApiResponse<{ jobs: UserJob[] }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/jobs/user/${user_token}/list`;
    return await this.get<{
      success: boolean;
      jobs: UserJob[];
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { jobs: response.jobs || [] },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListAllUsersBySignupDate(
    id_cursor?: number | null,
  ): Promise<
    ApiResponse<{ users: SignupUser[]; next_cursor: number | null }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/users/list_all_by_signup_date`;
    return await this.post<
      { id_cursor?: number | null },
      {
        success: boolean;
        users: SignupUser[];
        next_cursor: number | null;
        error_message?: string;
      }
    >({
      endpoint,
      body: { id_cursor: id_cursor ?? null },
    })
      .then((response) => ({
        success: response.success,
        data: {
          users: response.users || [],
          next_cursor: response.next_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListAvailableFeatureFlags(): Promise<
    ApiResponse<{ feature_flags: FeatureFlagDescriptor[] }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_feature_flags/list`;
    return await this.get<{
      success: boolean;
      feature_flags: FeatureFlagDescriptor[];
      error_message?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: { feature_flags: response.feature_flags || [] },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserFeatureFlags(
    username_or_token: string,
  ): Promise<ApiResponse<UserFeatureFlagsResponse>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_feature_flags/user/${encodeURIComponent(username_or_token)}`;
    return await this.get<
      { success: boolean; error_message?: string } & UserFeatureFlagsResponse
    >({ endpoint })
      .then((response) => ({
        success: response.success,
        data: {
          user_token: response.user_token,
          username: response.username,
          display_name: response.display_name,
          feature_flags: response.feature_flags || [],
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async EditUserFeatureFlags(
    username_or_token: string,
    action: EditUserFeatureFlagsAction,
  ): Promise<ApiResponse<void>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_feature_flags/user/${encodeURIComponent(username_or_token)}`;
    return await this.post<
      { action: EditUserFeatureFlagsAction },
      { success: boolean; error_message?: string }
    >({ endpoint, body: { action } })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListGlobalUserReferrals(
    cursor?: string | null,
    limit?: number,
  ): Promise<
    ApiResponse<{
      referrals: UserReferralListItem[];
      next_cursor: string | null;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_referrals/list`;
    return await this.get<{
      success: boolean;
      referrals: UserReferralListItem[];
      maybe_cursor: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        cursor: cursor ?? undefined,
        limit,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          referrals: response.referrals || [],
          next_cursor: response.maybe_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserReferralsForUser(
    username: string,
    cursor?: string | null,
    limit?: number,
  ): Promise<
    ApiResponse<{
      referrals: UserReferralListItem[];
      next_cursor: string | null;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_referrals/user/${encodeURIComponent(username)}/list`;
    return await this.get<{
      success: boolean;
      referrals: UserReferralListItem[];
      maybe_cursor: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        cursor: cursor ?? undefined,
        limit,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          referrals: response.referrals || [],
          next_cursor: response.maybe_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListSubscribersBySignupDate(
    id_cursor?: number | null,
  ): Promise<
    ApiResponse<{ users: SubscriberUser[]; next_cursor: number | null }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/users/list_subscribers_by_signup_date`;
    return await this.post<
      { id_cursor?: number | null },
      {
        success: boolean;
        users: SubscriberUser[];
        next_cursor: number | null;
        error_message?: string;
      }
    >({
      endpoint,
      body: { id_cursor: id_cursor ?? null },
    })
      .then((response) => ({
        success: response.success,
        data: {
          users: response.users || [],
          next_cursor: response.next_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ChangeUserEmail(
    user_token: string,
    new_email: string,
  ): Promise<ApiResponse<void>> {
    const endpoint = `${this.getApiSchemeAndHost()}/moderation/user_emails/change`;
    return await this.post<
      { user_token: string; new_email: string },
      { success: boolean; error_message?: string }
    >({ endpoint, body: { user_token, new_email } })
      .then((response) => ({
        success: response.success,
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public async ListUserEmailChanges(
    username: string,
    cursor?: string | null,
    limit?: number,
  ): Promise<
    ApiResponse<{ changes: UserEmailChange[]; next_cursor: string | null }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/moderation/user_emails/list/${encodeURIComponent(username)}`;
    return await this.get<{
      success: boolean;
      changes: UserEmailChange[];
      maybe_cursor: string | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        cursor: cursor ?? undefined,
        limit,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          changes: response.changes || [],
          next_cursor: response.maybe_cursor ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
