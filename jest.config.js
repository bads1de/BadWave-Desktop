/** @type {import('ts-jest').JestConfigWithTsJest} */
const commonConfig = {
  preset: "ts-jest",
  roots: ["<rootDir>"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          module: "commonjs",
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/dist/"],
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/.next/"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "hooks/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

module.exports = {
  projects: [
    {
      displayName: "electron-main",
      testMatch: ["**/__tests__/**/*.test.ts"],
      runner: "@kayahr/jest-electron-runner/main",
      testEnvironment: "node",
      testEnvironmentOptions: {
        // ESM専用パッケージ (music-metadata 等) を Node.js の require(esm) と同じ
        // 条件で解決させる。テスト側は jest.mock で差し替えるため実際の読込はしない。
        customExportConditions: ["node", "node-addons", "module-sync"],
      },
      ...commonConfig,
    },
    {
      displayName: "dom",
      testMatch: ["**/__tests__/**/*.test.tsx"],
      testEnvironment: "jsdom",
      ...commonConfig,
    },
  ],
};
