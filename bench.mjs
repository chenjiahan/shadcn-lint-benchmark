import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
export const targets = {
  fixture: fs
    .readdirSync(path.join(root, "fixture/components/ui"))
    .filter((p) => /\.tsx?$/.test(p))
    .sort()
    .map((p) => `components/ui/${p}`)
    .concat("lib/utils.ts"),
  stress: Array.from(
    { length: 1000 },
    (_, i) => `stress/dropdown-${String(i).padStart(4, "0")}.tsx`,
  ),
};
export const tools = ["oxlint", "rslint", "eslint"];
export const modes = Object.keys(
  JSON.parse(fs.readFileSync(path.join(root, "benchmark-suite.json"))).modes,
);
export function run(
  tool,
  mode,
  label,
  { capture = true, timing = false, extra = [] } = {},
) {
  const cwd = path.join(
    root,
    label === "stress"
      ? "stress-fixture"
      : label === "canary"
        ? "canary-fixture"
        : "fixture",
  );
  const env = {
    ...process.env,
    NO_COLOR: "1",
    NODE_DISABLE_COMPILE_CACHE: "1",
  };
  delete env.NODE_OPTIONS;
  delete env.FORCE_COLOR;
  delete env.TIMING;
  delete env.GOMAXPROCS;
  delete env.RAYON_NUM_THREADS;
  const bin = {
    eslint: "eslint/bin/eslint.js",
    oxlint: "oxlint/bin/oxlint",
    rslint: "@rslint/core/bin/rslint.js",
  }[tool];
  let args = {
    eslint: [
      "--no-config-lookup",
      "-c",
      `eslint.${mode}.mjs`,
      "--format",
      "json",
    ],
    oxlint: [
      "--no-ignore",
      "--disable-nested-config",
      "--type-aware",
      "-c",
      `oxlint.${mode}.json`,
      "--format",
      "json",
    ],
    rslint: ["-c", `rslint.${mode}.mjs`, "--format", "jsonline"],
  }[tool];
  if (timing) {
    if (tool === "eslint") env.TIMING = "all";
    else
      args.push(
        ...(tool === "rslint" ? ["--timing", "all"] : ["--debug", "timings"]),
      );
  }
  const start = performance.now();
  const p = spawnSync(
    process.execPath,
    [
      path.join(root, "node_modules", bin),
      ...args,
      ...extra,
      ...(targets[label] || ["canary.ts"]),
    ],
    {
      cwd,
      env,
      encoding: "utf8",
      stdio: capture ? "pipe" : "ignore",
      maxBuffer: 200 * 1024 * 1024,
      timeout: 300000,
    },
  );
  const ms = performance.now() - start;
  if (p.error || ![0, 1].includes(p.status))
    throw Error(
      `${tool}/${mode}/${label} ${p.error || p.status}\n${p.stdout}\n${p.stderr}`,
    );
  return { ms, status: p.status, stdout: p.stdout, stderr: p.stderr };
}
if (process.argv.includes("--probe")) {
  fs.mkdirSync("validation", { recursive: true });
  const labels = Object.keys(targets);
  for (const label of labels)
    for (const mode of modes)
      for (const tool of tools) {
        const r = run(tool, mode, label);
        fs.writeFileSync(
          `validation/${label}-${mode}-${tool}.stdout`,
          r.stdout,
        );
        fs.writeFileSync(
          `validation/${label}-${mode}-${tool}.stderr`,
          r.stderr,
        );
        console.log(
          label,
          mode,
          tool,
          r.ms.toFixed(1),
          r.status,
          r.stdout.slice(0, 100),
          r.stderr.slice(0, 500),
        );
      }
}
if (process.argv.includes("--measure")) {
  const rounds = Number(process.env.BENCH_ROUNDS || 20),
    samples = [];
  const cases = Object.keys(targets).flatMap((label) =>
    modes.flatMap((mode) => tools.map((tool) => ({ label, mode, tool }))),
  );
  let seed = 20260915;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const shuffle = (xs) => {
    xs = [...xs];
    for (let i = xs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
  };
  const statuses = JSON.parse(fs.readFileSync("expected-statuses.json"));
  for (let warm = 0; warm < 3; warm++) {
    for (const c of shuffle(cases)) {
      const r = run(c.tool, c.mode, c.label, { capture: false });
      if (r.status !== statuses[`${c.label}-${c.mode}-${c.tool}`])
        throw Error(`Unexpected warmup status ${JSON.stringify(c)}`);
    }
    console.log(`Warmup ${warm + 1}/3`);
  }
  for (let round = 0; round < rounds; round++) {
    for (const c of shuffle(cases)) {
      const r = run(c.tool, c.mode, c.label, { capture: false });
      if (r.status !== statuses[`${c.label}-${c.mode}-${c.tool}`])
        throw Error(`Unexpected status ${JSON.stringify(c)}`);
      samples.push({ ...c, round, ms: r.ms, status: r.status });
      fs.writeFileSync(
        "timings.json",
        JSON.stringify(
          { rounds, warmups: 3, seed: 20260915, samples },
          null,
          2,
        ),
      );
    }
    console.log(`Round ${round + 1}/${rounds}`);
  }
}
