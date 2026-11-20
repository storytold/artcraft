/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/e2e/"],
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/app/src/$1",
  },
  automock: false,
};
