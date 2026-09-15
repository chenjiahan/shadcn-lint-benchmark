import base from "./eslint.combined.mjs";
import core from "../core-rules.json" with { type: "json" };
export default base.map((config) =>
  config.rules
    ? {
        ...config,
        languageOptions: {
          ...config.languageOptions,
          globals: { process: "readonly" },
        },
        rules: { ...config.rules, ...core },
      }
    : config,
);
