export interface UserInfo {
  id: string;
  username: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
  gravatar_url?: string;
  gravatar_hash?: string;
  disable_gravatar?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface AppStateUserInfo {
  user_token: string;
  username: string;
  display_name: string;
  gravatar_hash: string;
  default_avatar: {
    color_index: number;
    image_index: number;
  };
}

export interface Wallet {
  banked_credits: number;
  created_at: string;
  monthly_credits: number;
  token: string;
  updated_at: string;
  version: number;
  wallet_namespace: string;
}

export interface WalletWithOwner extends Wallet {
  owner_user_token: string;
}

export interface WalletLedgerEntry {
  banked_credits_after: number;
  banked_credits_before: number;
  created_at: string;
  credits_delta: number;
  entry_type: string;
  is_refunded: boolean;
  maybe_entity_ref: string | null;
  maybe_linked_refund_ledger_token: string | null;
  monthly_credits_after: number;
  monthly_credits_before: number;
  token: string;
}

export interface WalletLedgerEntryWithWallet extends WalletLedgerEntry {
  wallet_token: string;
}

export interface UserJob {
  credits_delta: number | null;
  job_failure_reason: string | null;
  job_status: string;
  job_token: string;
  maybe_linked_refund_ledger_token: string | null;
  on_success_result_media_token: string | null;
  wallet_ledger_entry_token: string | null;
  wallet_ledger_entry_type: string | null;
  maybe_external_third_party: string | null;
  maybe_external_third_party_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerationJob {
  assigned_cluster: string | null;
  assigned_worker: string | null;
  attempt_count: number;
  created_at: string;
  creator_ip_address: string;
  creator_set_visibility: string;
  failure_reason: string | null;
  frontend_failure_category: string | null;
  inference_category: string;
  internal_debugging_failure_reason: string | null;
  maybe_creator_anonymous_visitor_token: string | null;
  maybe_creator_user_token: string | null;
  maybe_debug_log_event_token: string | null;
  maybe_download_url: string | null;
  maybe_external_third_party: string | null;
  maybe_external_third_party_id: string | null;
  maybe_inference_args: string | null;
  maybe_job_type: string | null;
  maybe_model_token: string | null;
  maybe_model_type: string | null;
  maybe_product_category: string | null;
  maybe_prompt_token: string | null;
  maybe_routing_tag: string | null;
  maybe_wallet_ledger_entry_token: string | null;
  on_success_result_batch_token: string | null;
  on_success_result_entity_token: string | null;
  on_success_result_entity_type: string | null;
  status: string;
  token: string;
  updated_at: string;
  uuid_idempotency_token: string;
}

export type DebugLogType =
  | "http_request"
  | "fal_request"
  | "fal_queue"
  | "fal_webhook"
  | "kinovi_request"
  | (string & {});

export interface DebugLog {
  created_at: string;
  debug_log_type: DebugLogType;
  event_token: string;
  id: number;
  maybe_creator_user_token: string | null;
  message: string;
}

export interface SignupUser {
  created_at: string;
  display_name: string;
  email_address: string;
  email_confirmed: boolean;
  id: number;
  ip_address_creation: string;
  is_temporary: boolean;
  is_without_password: boolean;
  maybe_referral_url: string | null;
  maybe_signup_method: string | null;
  maybe_source: string | null;
  token: string;
  username: string;
  username_is_not_customized: boolean;
}

export interface SubscriberUser extends SignupUser {
  maybe_cancel_at: string | null;
  maybe_canceled_at: string | null;
  maybe_stripe_customer_id: string | null;
  maybe_stripe_invoice_is_paid: boolean | null;
  maybe_stripe_price_id: string | null;
  maybe_stripe_product_id: string | null;
  maybe_stripe_recurring_interval: string | null;
  maybe_stripe_subscription_id: string | null;
  maybe_stripe_subscription_status: string | null;
  subscription_namespace: string;
  subscription_product_slug: string;
}

export interface ImpersonationRequest {
  created_at: string;
  expires_at: string;
  impersonated_display_name: string;
  impersonated_user_token: string;
  impersonated_username: string;
  impersonator_display_name: string;
  impersonator_user_token: string;
  impersonator_username: string;
  is_expired: boolean;
  is_redeemed: boolean;
  updated_at: string;
}

export interface StaffAuditLog {
  audit_action: string;
  created_at: string;
  maybe_entity_token: string | null;
  maybe_entity_type: string | null;
  maybe_target_display_name: string | null;
  maybe_target_username: string | null;
  staff_display_name: string | null;
  staff_ip_address: string;
  staff_user_token: string | null;
  staff_username: string | null;
  token: string;
}

export interface UserEmailChangeUserSummary {
  user_token: string;
  username: string;
  display_name: string;
  gravatar_hash: string;
}

export interface UserEmailChange {
  id: number;
  user: UserEmailChangeUserSummary;
  /** The user that performed the change. Null for self-service changes. */
  maybe_changed_by_user: UserEmailChangeUserSummary | null;
  old_email: string;
  new_email: string;
  ip_address: string;
  created_at: string;
}

export interface AppStateResponse {
  success: boolean;
  is_banned: boolean;
  is_logged_in: boolean;
  maybe_user_info: AppStateUserInfo | null;
  permissions: {
    is_moderator: boolean;
    feature_flags: string[];
    legacy_permission_flags: Record<string, boolean>;
  };
  refresh_interval_millis: number;
}
