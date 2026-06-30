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

export interface UserSpendEvent {
  token: string;
  payments_namespace: string;
  maybe_user_token: string | null;
  maybe_username: string | null;
  maybe_display_name: string | null;
  maybe_email_gravatar_hash: string | null;
  event_type: string;
  amount_usd_cents: number;
  maybe_credits_granted: number | null;
  payment_source: string;
  maybe_source_object_id: string | null;
  maybe_stripe_invoice_id: string | null;
  maybe_stripe_payment_intent_id: string | null;
  maybe_stripe_charge_id: string | null;
  maybe_stripe_customer_id: string | null;
  is_production: boolean;
  payment_occurred_at: string;
  created_at: string;
}

export interface UserSpendSummary {
  payments_namespace: string;
  user_token: string;
  lifetime_gross_spend_usd_cents: number;
  lifetime_subscription_spend_usd_cents: number;
  lifetime_credits_spend_usd_cents: number;
  lifetime_refund_usd_cents: number;
  lifetime_net_spend_usd_cents: number;
  lifetime_payment_count: number;
  lifetime_refund_count: number;
  maybe_first_payment_at: string | null;
  first_spend_usd_cents: number;
  maybe_last_payment_at: string | null;
  last_spend_usd_cents: number;
  maybe_days_since_first_payment: number | null;
  maybe_days_since_last_payment: number | null;
  net_spend_7d_usd_cents: number;
  net_spend_prev_7d_usd_cents: number;
  net_spend_14d_usd_cents: number;
  net_spend_prev_14d_usd_cents: number;
  net_spend_30d_usd_cents: number;
  net_spend_prev_30d_usd_cents: number;
  net_spend_60d_usd_cents: number;
  net_spend_90d_usd_cents: number;
  net_spend_this_year_usd_cents: number;
  avg_weekly_net_spend_4w_usd_cents: number;
  avg_weekly_net_spend_12w_usd_cents: number;
  active_weeks_in_last_4: number;
  active_weeks_in_last_8: number;
  active_weeks_in_last_12: number;
  active_weeks_in_last_24: number;
  active_weeks_in_last_52: number;
  consecutive_active_weeks: number;
  consecutive_inactive_weeks: number;
  maybe_weeks_since_last_spend: number | null;
  is_active_subscriber: boolean;
  maybe_subscription_interval: string | null;
  maybe_reengagement_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserDailySpend {
  payments_namespace: string;
  spend_date: string;
  subscription_spend_usd_cents: number;
  credits_spend_usd_cents: number;
  gross_spend_usd_cents: number;
  refund_usd_cents: number;
  net_spend_usd_cents: number;
  payment_count: number;
  credits_granted: number;
  created_at: string;
  updated_at: string;
}

export class ModerationApi extends ApiManager {
  // Full spend summary for one user.
  public async GetUserSpendSummary(
    user_token: string,
    payments_namespace?: string,
  ): Promise<ApiResponse<{ summary: UserSpendSummary | null }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_spend_summaries/summary/${encodeURIComponent(user_token)}`;
    return await this.get<{
      success: boolean;
      maybe_summary: UserSpendSummary | null;
      error_message?: string;
    }>({
      endpoint,
      query: { payments_namespace: payments_namespace ?? undefined },
    })
      .then((response) => ({
        success: response.success,
        data: { summary: response.maybe_summary ?? null },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // One page of a user's daily spend rows (offset-paginated, newest date first).
  public async ListUserDailySpends(
    user_token: string,
    offset?: number | null,
    limit?: number,
    payments_namespace?: string,
  ): Promise<ApiResponse<{ records: UserDailySpend[]; next_offset: number | null }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_daily_spends/user/${encodeURIComponent(user_token)}`;
    return await this.get<{
      success: boolean;
      records: UserDailySpend[];
      maybe_next_offset: number | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        offset: offset ?? undefined,
        limit,
        payments_namespace: payments_namespace ?? undefined,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          records: response.records || [],
          next_offset: response.maybe_next_offset ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({ success: false, errorMessage: err.message }));
  }

  // Spend events list (offset-paginated, newest payment first).
  public async ListUserSpendEvents(
    offset?: number | null,
    payments_namespace?: string,
  ): Promise<
    ApiResponse<{
      events: UserSpendEvent[];
      next_offset: number | null;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_spend_events/list`;
    return await this.get<{
      success: boolean;
      events: UserSpendEvent[];
      maybe_next_offset: number | null;
      error_message?: string;
    }>({
      endpoint,
      query: {
        offset: offset ?? undefined,
        payments_namespace: payments_namespace ?? undefined,
      },
    })
      .then((response) => ({
        success: response.success,
        data: {
          events: response.events || [],
          next_offset: response.maybe_next_offset ?? null,
        },
        errorMessage: response.error_message,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

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
