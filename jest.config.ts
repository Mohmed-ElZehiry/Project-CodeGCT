import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  testEnvironment: "jsdom",
  moduleDirectories: ["node_modules", "<rootDir>/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(customJestConfig);
