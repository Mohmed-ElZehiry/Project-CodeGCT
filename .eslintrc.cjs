module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      files: ["*.config.{js,cjs,mjs,ts}", "*.config.ts"],
      env: {
        node: true,
      },
    },
  ],
};
