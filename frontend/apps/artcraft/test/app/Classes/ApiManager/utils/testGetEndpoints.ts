import { ApiManager } from "~/Classes/ApiManager/ApiManager";

interface TestConfig {
  name: string;
  function: (...args: any[]) => any;
  endpoint: string;
  params: any;
}

export default function testGetEndpoints(
  api: ApiManager,
  testMethod: TestConfig,
  mockData: any,
) {
  describe(testMethod.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("success", async () => {
      jest.spyOn(api, "fetch").mockResolvedValue({
        ...mockData,
        success: true,
      });
      const response = await testMethod.function(testMethod.params);
      expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
        method: "GET",
        body: undefined,
        query: undefined,
      });
      expect(response).toEqual({
        data: mockData,
        success: true,
        errorMessage: undefined,
      });
    });

    it("exception", async () => {
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await testMethod.function(testMethod.params);
      expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
        method: "GET",
        body: undefined,
        query: undefined,
      });
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });
}
