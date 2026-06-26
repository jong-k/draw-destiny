/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import("@ianvs/prettier-plugin-sort-imports").PluginConfig}
 */
const config = {
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/assets/(.*)$",
    "^@/(.*)$",
    "",
    "^[./]",
  ],
  importOrderTypeScriptVersion: "6.0.0",
};

export default config;
