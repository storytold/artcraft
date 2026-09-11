import { ApiManager, ApiResponse } from "./ApiManager";
import { BetaKey } from "~/models";
import type { Pagination } from "@storyteller/ui-pagescene";

export class BetaKeysApi extends ApiManager {
  public CreateBetaKey({
    maybeNote,
    maybeReferrerUsername,
    numberOfKeys,
    uuidIdempotencyToken,
  }: {
    maybeNote?: string;
    maybeReferrerUsername?: string;
    numberOfKeys: number;
    uuidIdempotencyToken: string;
  }): Promise<ApiResponse<string[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/beta_keys/create`;

    const body = {
      maybe_note: maybeNote,
      maybe_referrer_username: maybeReferrerUsername,
      number_of_keys: numberOfKeys,
      uuid_idempotency_token: uuidIdempotencyToken,
    };

    return this.post<
      {
        maybe_note?: string;
        maybe_referrer_username?: string;
        number_of_keys: number;
        uuid_idempotency_token: string;
      },
      {
        success?: boolean;
        beta_keys?: string[];
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: response.beta_keys,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListBetaKeys({
    sortAscending,
    pageSize,
    pageIndex,
    maybeReferrerUsername,
    onlyListRemaining,
  }: {
    sortAscending?: boolean;
    pageSize?: number;
    pageIndex?: number;
    maybeReferrerUsername?: string;
    onlyListRemaining?: boolean;
  }): Promise<ApiResponse<BetaKey[], Pagination>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/beta_keys/list`;

    const query = {
      sort_ascending: sortAscending,
      page_size: pageSize,
      page_index: pageIndex,
      maybe_referrer_username: maybeReferrerUsername,
      only_list_remaining: onlyListRemaining,
    };

    return this.get<{
      success?: boolean;
      beta_keys?: BetaKey[];
      pagination?: Pagination;
      BadInput?: string;
    }>({ endpoint, query })
      .then((response) => ({
        success: response.success ?? false,
        data: response.beta_keys,
        pagination: response.pagination,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public RedeemBetaKey({
    betaKey,
  }: {
    betaKey: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/beta_keys/redeem`;

    return this.post<
      {
        beta_key: string;
      },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { beta_key: betaKey } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public UpdateBetaKeyIsDistributed({
    betaKey,
    isDistributed,
  }: {
    betaKey: string;
    isDistributed: boolean;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/beta_keys/${betaKey}/distributed`;

    return this.post<
      {
        is_distributed: boolean;
      },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { is_distributed: isDistributed } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public UpdateBetaKeyNote({
    token,
    note,
  }: {
    token: string;
    note?: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/beta_keys/${token}/note`;

    return this.post<
      {
        note?: string;
      },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { note } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
