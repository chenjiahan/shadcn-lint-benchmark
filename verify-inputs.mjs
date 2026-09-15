import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const revision = "53de86f0e7dcc341a9cb45c383a9f2c454d1e958";
assert.equal(
  execFileSync("git", ["-C", ".upstream", "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  revision,
);
const walk = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
    );
const hashes = {};
const hash = (p) =>
  crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
for (const p of walk("fixture").filter(
  (p) => /\.(tsx?|css)$/.test(p) || p.endsWith("components.json"),
)) {
  const rel = path.relative("fixture", p);
  assert.equal(
    hash(p),
    hash(path.join(".upstream/packages/evals/fixture-rich", rel)),
    p,
  );
  assert.equal(hash(p), hash(path.join("stress-fixture", rel)), p);
  hashes[p] = hash(p);
}
assert.equal(Object.keys(hashes).filter((p) => /\.tsx?$/.test(p)).length, 12);
const sourceHash = hash("fixture/components/ui/dropdown-menu.tsx");
const copies = walk("stress-fixture/stress");
assert.equal(copies.length, 1000);
for (const p of copies) assert.equal(hash(p), sourceHash, p);
for (const p of walk("plugin").filter((p) => p.endsWith(".js"))) {
  assert.equal(
    hash(p),
    hash(path.join(".upstream/packages/lint/dist", path.basename(p))),
    p,
  );
  hashes[p] = hash(p);
}
const ts = JSON.parse(fs.readFileSync("ts-rules.json"));
assert.equal(Object.keys(ts).length, 23);
for (const dir of ["fixture", "stress-fixture", "canary-fixture"]) {
  assert.deepEqual(
    JSON.parse(fs.readFileSync(`${dir}/tsconfig.json`)),
    JSON.parse(fs.readFileSync("fixture/tsconfig.json")),
  );
  for (const mode of dir === "canary-fixture"
    ? ["ts", "combined"]
    : ["ts", "combined", "core-ts", "core-combined"]) {
    const es = (await import(`./${dir}/eslint.${mode}.mjs`)).default[0].rules;
    const rs = (await import(`./${dir}/rslint.${mode}.mjs`)).default[0].rules;
    const ox = JSON.parse(fs.readFileSync(`${dir}/oxlint.${mode}.json`)).rules;
    const normalized = Object.fromEntries(
      Object.entries(ox).map(([k, v]) => [
        k.replace(/^typescript\//, "@typescript-eslint/"),
        v,
      ]),
    );
    assert.deepEqual(es, rs);
    assert.deepEqual(es, normalized);
    assert.equal(
      Object.keys(es).length,
      (mode.includes("combined") ? 29 : 23) +
        (mode.startsWith("core-") ? 61 : 0),
    );
    for (const [k, v] of Object.entries(ts)) assert.equal(es[k], v);
  }
}
fs.writeFileSync(
  "input-check.json",
  JSON.stringify(
    {
      upstream: revision,
      sourceHashes: hashes,
      stressCopies: 1000,
      stressCopySha256: sourceHash,
      ruleCounts: { ts: 23, combined: 29, "core-ts": 84, "core-combined": 90 },
      passed: true,
    },
    null,
    2,
  ),
);
console.log(
  "PASS: upstream source, compiled plugin, 1,000 identical copies, and rule configurations",
);
