import { authentication } from "~/signals";
import EnvironmentVariables from "~/Classes/EnvironmentVariables";
import { UserInfo } from "~/models";
import { BillingApi } from "~/Classes/ApiManager/BillingApi";
const mockActiveSubscription = {
  active_subscriptions: [
    {
      namespace: "ns1",
      product_slug: "ps1",
    },
  ],
  maybe_loyalty_program: "mlp1",
};

describe("BillingApi", () => {
  beforeAll(() => {
    authentication.userInfo.value = {
      user_token: "un1",
      username: "un1",
    } as UserInfo;
    EnvironmentVariables.initialize({ BASE_API: "http://localhost:3000" });
  });
  describe("ListActiveSubscriptions", () => {
    it("fetch data", async () => {
      const billingApi = new BillingApi();
      jest.spyOn(billingApi, "fetch").mockResolvedValue({
        success: true,
        ...mockActiveSubscription,
      });

      const response = await billingApi.ListActiveSubscriptions();
      expect(billingApi.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/v1/billing/active_subscriptions",
        {
          method: "GET",
          body: undefined,
          query: undefined,
        },
      );
      expect(response).toEqual({
        success: true,
        data: mockActiveSubscription,
      });
    });
  });
});
