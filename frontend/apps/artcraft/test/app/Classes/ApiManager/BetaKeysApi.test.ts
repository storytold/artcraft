import { authentication } from "~/signals";
import { UserInfo } from "~/models";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { BetaKeysApi } from "~/Classes/ApiManager/BetaKeysApi";
import testUpdateDeleteEndpoints from "./utils/testUpdateDeleteEndpoints";
import testListEndpoints from "./utils/testListEndpoints";

const mockBetaKey = {
  created_at: "2024-06-16T00:06:04.724Z",
  creator: {
    default_avatar: {
      color_index: 0,
      image_index: 0,
    },
    display_name: "string",
    gravatar_hash: "string",
    user_token: "string",
    username: "string",
  },
  is_distributed: true,
  key_value: "string",
  maybe_note: "string",
  maybe_note_html: "string",
  maybe_redeemed_at: "2024-06-16T00:06:04.724Z",
  maybe_redeemer: {
    default_avatar: {
      color_index: 0,
      image_index: 0,
    },
    display_name: "string",
    gravatar_hash: "string",
    user_token: "string",
    username: "string",
  },
  maybe_referrer: {
    default_avatar: {
      color_index: 0,
      image_index: 0,
    },
    display_name: "string",
    gravatar_hash: "string",
    user_token: "string",
    username: "string",
  },
  product: "studio",
  token: "string",
};

EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });

describe("BetaKeysApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
  });
  describe("run update/delete tests", () => {
    const api = new BetaKeysApi();
    [
      {
        name: "CreateBetaKey",
        function: api.CreateBetaKey.bind(api),
        endpoint: "http://localhost:3000/v1/beta_keys/create",
        method: "POST",
        paramsIn: {
          maybeNote: "mn1",
          maybeReferrerUsername: "mru1",
          numberOfKeys: 3,
          uuidIdempotencyToken: "uuid",
        },
        paramsTest: {
          maybe_note: "mn1",
          maybe_referrer_username: "mru1",
          number_of_keys: 3,
          uuid_idempotency_token: "uuid",
        },
        response: {
          beta_keys: ["bk1", "bk2"],
        },
        data: ["bk1", "bk2"],
      },
      {
        name: "RedeemBetaKey",
        function: api.RedeemBetaKey.bind(api),
        endpoint: "http://localhost:3000/v1/beta_keys/redeem",
        method: "POST",
        hasFailure: true,
        paramsIn: {
          betaKey: "t1",
        },
        paramsTest: { beta_key: "t1" },
      },
      {
        name: "UpdateBetaKeyIsDistributed",
        function: api.UpdateBetaKeyIsDistributed.bind(api),
        endpoint: "http://localhost:3000/v1/beta_keys/bk1/distributed",
        method: "POST",
        hasFailure: true,
        paramsIn: {
          betaKey: "bk1",
          isDistributed: true,
        },
        paramsTest: { is_distributed: true },
      },
      {
        name: "UpdateBetaKeyNote",
        function: api.UpdateBetaKeyNote.bind(api),
        endpoint: "http://localhost:3000/v1/beta_keys/t1/note",
        method: "POST",
        hasFailure: true,
        paramsIn: { token: "t1", note: "a note" },
        paramsTest: { note: "a note" },
        response: {
          token: "t1",
          note: "a note",
        },
      },
    ].forEach((testMethod) => {
      testUpdateDeleteEndpoints(api, testMethod);
    });
  });

  describe("run list tests", () => {
    const api = new BetaKeysApi();
    [
      {
        name: "ListBetaKeys",
        function: api.ListBetaKeys.bind(api),
        pagination: {
          current: 0,
          total_page_count: 0,
        },
        hasFailure: true,
        tests: [
          {
            name: "no params",
            endpoint: "http://localhost:3000/v1/beta_keys/list",
            query: {},
            fetchQuery: {
              maybe_referrer_username: undefined,
              only_list_remaining: undefined,
              page_index: undefined,
              page_size: undefined,
              sort_ascending: undefined,
            },
            response: {
              beta_keys: [mockBetaKey],
              success: true,
            },
            data: [mockBetaKey],
          },
        ],
      },
    ].forEach((testMethod) => {
      testListEndpoints(api, testMethod);
    });
  });
});
