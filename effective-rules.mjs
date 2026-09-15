import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { run, modes } from "./bench.mjs";
const root = path.dirname(fileURLToPath(import.meta.url));
const output = {};
for (const mode of modes) {
  const expected = Object.keys(
    (await import(`./fixture/eslint.${mode}.mjs`)).default[0].rules,
  ).sort();
  const es = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules/eslint/bin/eslint.js"),
      "--no-config-lookup",
      "-c",
      `eslint.${mode}.mjs`,
      "--print-config",
      "components/ui/dropdown-menu.tsx",
    ],
    { cwd: path.join(root, "fixture"), encoding: "utf8" },
  );
  assert.equal(es.status, 0, es.stderr);
  const active = Object.entries(JSON.parse(es.stdout).rules)
    .filter(([, v]) => (Array.isArray(v) ? v[0] : v) !== 0)
    .map(([k]) => k)
    .sort();
  assert.deepEqual(active, expected, `ESLint ${mode}`);
  const rs = run("rslint", mode, "fixture", { timing: true });
  const text = rs.stdout + "\n" + rs.stderr;
  const rows = [
    ...text.matchAll(
      /^(\S+)\s+\|\s+(native|js)\s+\|\s+[\d.]+\s+\|\s+(\d+)\s+\|/gm,
    ),
  ]
    .map((m) => ({ rule: m[1], engine: m[2], files: Number(m[3]) }))
    .sort((a, b) => a.rule.localeCompare(b.rule));
  assert.deepEqual(rows.map((r) => r.rule).sort(), expected, `Rslint ${mode}`);
  assert.ok(
    rows.every((r) => r.files === 12),
    `Rslint ${mode}: file count`,
  );
  output[mode] = { eslintActiveRules: active, rslintExecutedRules: rows };
  fs.writeFileSync(
    path.join(root, `validation/rslint-${mode}-timing.txt`),
    text,
  );
  console.log(
    `PASS: ${mode}: ${expected.length} effective ESLint/Rslint rules; every Rslint rule executed on 12 files`,
  );
}
fs.writeFileSync(
  path.join(root, "validation/effective-rules.json"),
  JSON.stringify(output, null, 2) + "\n",
);
