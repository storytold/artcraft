import { ApiManager } from "~/Classes/ApiManager/ApiManager";

interface TestConfig {
  name: string;
  function: (...args: any[]) => any;
  pagination?: any;
  hasFailure?: boolean;
  tests: Test[];
}

interface Test {
  name: string;
  endpoint: string;
  query?: any;
  fetchQuery?: any;
  response: any;
  data: any;
}

export default function testListEndpoints(
  api: ApiManager,
  testMethod: TestConfig,
) {
  describe(testMethod.name, () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    testMethod.tests.forEach((test) => {
      it(test.name, async () => {
        jest.spyOn(api, "fetch").mockResolvedValue({
          ...(test.response ?? {}),
          ...(testMethod.pagination
            ? { pagination: testMethod.pagination }
            : {}),
        });
        const response = await testMethod.function(test.query as any);
        expect(api.fetch).toHaveBeenCalledWith(test.endpoint, {
          method: "GET",
          query: test.fetchQuery,
        });
        expect(response).toEqual({
          data: test.data,
          ...(testMethod.pagination
            ? { pagination: testMethod.pagination }
            : {}),
          success: true,
          ...(testMethod.hasFailure ? { errorMessage: undefined } : {}),
        });
      });
    });

    if (testMethod.hasFailure) {
      it("failure", async () => {
        jest.spyOn(api, "fetch").mockResolvedValue({ BadInput: "Bad Input" });
        const response = await testMethod.function(
          testMethod.tests[0].query as any,
        );
        expect(api.fetch).toHaveBeenCalledWith(testMethod.tests[0].endpoint, {
          method: "GET",
          query: testMethod.tests[0].fetchQuery,
        });
        expect(response).toEqual({
          success: false,
          errorMessage: "Bad Input",
        });
      });
    }

    it("exception", async () => {
      jest.spyOn(api, "fetch").mockRejectedValue(new Error("server error"));
      const response = await testMethod.function(
        testMethod.tests[0].query as any,
      );
      expect(api.fetch).toHaveBeenCalledWith(testMethod.tests[0].endpoint, {
        method: "GET",
        query: testMethod.tests[0].fetchQuery,
      });
      expect(response).toEqual({
        success: false,
        errorMessage: "server error",
      });
    });
  });
}
