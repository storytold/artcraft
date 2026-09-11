/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/app/src/$1",
  },
  automock: false,
};
