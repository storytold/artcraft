/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  // These DOM/IPC regression specs use Vitest; run them with npm run test:themes.
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/app/src/themes/"],
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/app/src/$1",
  },
  automock: false,
};
