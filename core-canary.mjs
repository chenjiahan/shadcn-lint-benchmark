import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { builtinRules } from "eslint/use-at-your-own-risk";
import { js } from "@rslint/core";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.join(root, "core-canary-fixture");
const core = JSON.parse(fs.readFileSync(path.join(root, "core-rules.json")));
const canaries = JSON.parse(
  fs.readFileSync(path.join(root, "core-canaries.json")),
);
assert.deepEqual(Object.keys(core).sort(), Object.keys(canaries).sort());
const bins = {
  eslint: "eslint/bin/eslint.js",
  oxlint: "oxlint/bin/oxlint",
  rslint: "@rslint/core/bin/rslint.js",
};
const env = { ...process.env, NO_COLOR: "1", NODE_DISABLE_COMPILE_CACHE: "1" };
for (const key of [
  "NODE_OPTIONS",
  "FORCE_COLOR",
  "TIMING",
  "GOMAXPROCS",
  "RAYON_NUM_THREADS",
])
  delete env[key];
const oxCatalog = spawnSync(
  process.execPath,
  [path.join(root, "node_modules", bins.oxlint), "--rules", "--format", "json"],
  { encoding: "utf8", env },
);
assert.equal(oxCatalog.status, 0);
const oxRules = new Set(
  JSON.parse(oxCatalog.stdout)
    .filter((r) => r.scope === "eslint")
    .map((r) => r.value),
);
const recommended = [...builtinRules]
  .filter(([, r]) => r.meta.docs.recommended)
  .map(([k]) => k)
  .sort();
assert.equal(recommended.length, 64);
assert.deepEqual(
  recommended.filter((k) => !oxRules.has(k)),
  ["no-dupe-args", "no-octal"],
);
assert.deepEqual(
  Object.keys(core).sort(),
  recommended.filter(
    (k) => oxRules.has(k) && k !== "no-nonoctal-decimal-escape",
  ),
);
for (const rule of Object.keys(core))
  assert.ok(js.configs.recommended.rules[rule] || rule === "no-undef", rule);
fs.mkdirSync(cwd, { recursive: true });
fs.mkdirSync(path.join(root, "validation"), { recursive: true });
fs.writeFileSync(path.join(cwd, "helper.mjs"), "export let value = 1;\n");
fs.writeFileSync(
  path.join(cwd, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
    },
    include: ["*.cjs", "*.mjs"],
  }),
);
const configs = [],
  overrides = [],
  files = [],
  expectations = {};
for (const [rule, code] of Object.entries(canaries))
  for (const positive of [true, false]) {
    const file = `${rule}.${positive ? "positive" : "negative"}.${rule === "no-import-assign" ? "mjs" : "cjs"}`;
    fs.writeFileSync(
      path.join(cwd, file),
      (positive ? code : "console.log(1);") + "\n",
    );
    files.push(file);
    expectations[file] = { rule, positive };
    configs.push({
      files: [file],
      languageOptions: {
        sourceType: file.endsWith(".mjs") ? "module" : "commonjs",
        ecmaVersion: "latest",
        globals: { console: "readonly" },
      },
      rules: { [rule]: "error" },
    });
    overrides.push({ files: [file], rules: { [rule]: "error" } });
  }
for (const tool of ["eslint", "rslint"])
  fs.writeFileSync(
    path.join(cwd, `${tool}.mjs`),
    "export default " + JSON.stringify(configs, null, 2) + ";\n",
  );
fs.writeFileSync(
  path.join(cwd, "oxlint.json"),
  JSON.stringify(
    {
      plugins: [],
      categories: { correctness: "off" },
      globals: { console: "readonly" },
      overrides,
    },
    null,
    2,
  ),
);
const results = {};
for (const tool of ["oxlint", "rslint", "eslint"]) {
  const args = {
    oxlint: [
      "--no-ignore",
      "--disable-nested-config",
      "-c",
      "oxlint.json",
      "--format",
      "json",
    ],
    rslint: ["-c", "rslint.mjs", "--format", "jsonline"],
    eslint: ["--no-config-lookup", "-c", "eslint.mjs", "--format", "json"],
  }[tool];
  const p = spawnSync(
    process.execPath,
    [path.join(root, "node_modules", bins[tool]), ...args, ...files],
    {
      cwd,
      env,
      encoding: "utf8",
      maxBuffer: 30 * 1024 * 1024,
      timeout: 120000,
    },
  );
  fs.writeFileSync(
    path.join(root, `validation/core-canary-${tool}.stdout`),
    p.stdout ?? "",
  );
  fs.writeFileSync(
    path.join(root, `validation/core-canary-${tool}.stderr`),
    p.stderr ?? "",
  );
  assert.ok(!p.error, p.error?.message);
  assert.equal(p.status, 1, `${tool}: ${p.stderr}`);
  assert.equal(p.stderr, "", tool);
  let findings = [];
  if (tool === "eslint")
    for (const f of JSON.parse(p.stdout)) {
      assert.equal(f.fatalErrorCount, 0, JSON.stringify(f));
      findings.push(
        ...f.messages.map((m) => ({
          file: path.basename(f.filePath),
          rule: m.ruleId,
          message: m.message,
          line: m.line,
          column: m.column,
        })),
      );
    }
  else if (tool === "oxlint") {
    const v = JSON.parse(p.stdout);
    assert.equal(v.number_of_files, files.length);
    findings = v.diagnostics.map((m) => ({
      file: path.basename(m.filename),
      rule: m.code.replace(/^eslint\(/, "").replace(/\)$/, ""),
      message: m.message,
      line: m.labels[0]?.span.line,
      column: m.labels[0]?.span.column,
    }));
  } else
    findings = p.stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const m = JSON.parse(l);
        return {
          file: path.basename(m.filePath),
          rule: m.ruleName,
          message: m.message,
          line: m.range.start.line,
          column: m.range.start.column,
        };
      });
  const byRule = {};
  const missing = [];
  const unexpected = [];
  for (const [file, expected] of Object.entries(expectations)) {
    const messages = findings.filter((m) => m.file === file);
    if (expected.positive && !messages.some((m) => m.rule === expected.rule))
      missing.push(expected.rule);
    for (const m of messages)
      if (!expected.positive || m.rule !== expected.rule) unexpected.push(m);
    if (expected.positive)
      byRule[expected.rule] = messages.filter(
        (m) => m.rule === expected.rule,
      ).length;
  }
  results[tool] = { findings: findings.length, byRule, missing, unexpected };
  console.log(tool, JSON.stringify(results[tool]));
}
fs.writeFileSync(
  path.join(root, "validation/core-canary-summary.json"),
  JSON.stringify(
    {
      recommendedRules: recommended,
      excludedRules: ["no-dupe-args", "no-nonoctal-decimal-escape", "no-octal"],
      enabledCoreRules: Object.keys(core),
      positiveCases: 61,
      negativeCases: 61,
      results,
    },
    null,
    2,
  ) + "\n",
);
for (const [tool, result] of Object.entries(results)) {
  assert.deepEqual(result.missing, [], `${tool}: missing positive findings`);
  assert.deepEqual(result.unexpected, [], `${tool}: unexpected findings`);
  assert.deepEqual(
    result.byRule,
    results.eslint.byRule,
    `${tool}: rule finding counts differ`,
  );
}
console.log(
  "PASS: all 61 shared recommended core rules report positive cases and accept negative controls",
);
