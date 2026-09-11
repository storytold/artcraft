import { ApiManager } from "~/Classes/ApiManager/ApiManager";

interface TestConfig {
  name: string;
  function: (...args: any[]) => any;
  endpoint: string;
  method: string;
  hasFailure?: boolean;
  paramsIn: any;
  paramsTest: any;
  response?: any;
  data?: any;
}

export default function testUpdateDeleteEndpoints(
  api: ApiManager,
  testMethod: TestConfig,
) {
  describe(testMethod.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("success", async () => {
      jest.spyOn(api, "fetch").mockResolvedValue({
        success: true,
        ...(testMethod.hasFailure ? { errorMessage: undefined } : {}),
        ...(testMethod.response ? testMethod.response : {}),
      });
      const response = await testMethod.function(testMethod.paramsIn);
      expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
        method: testMethod.method,
        body: testMethod.paramsTest,
        query: undefined,
      });
      expect(response).toEqual({
        success: true,
        errorMessage: undefined,
        ...(testMethod.data ? { data: testMethod.data } : {}),
      });
    });

    if (testMethod.hasFailure) {
      it("failure", async () => {
        jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "Bad Input" });
        const response = await testMethod.function(testMethod.paramsIn);
        expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
          method: testMethod.method,
          body: testMethod.paramsTest,
          query: undefined,
        });
        expect(response).toEqual({
          success: false,
          errorMessage: "Bad Input",
        });
      });
    }

    it("exception", async () => {
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await testMethod.function(testMethod.paramsIn);
      expect(api.fetch).toHaveBeenCalledWith(testMethod.endpoint, {
        method: testMethod.method,
        body: testMethod.paramsTest,
        query: undefined,
      });
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });
}
