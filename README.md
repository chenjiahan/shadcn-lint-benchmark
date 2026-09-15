# Shadcn lint benchmark

Reproducible comparison of **Oxlint, Rslint, and ESLint** running the same Shadcn plugin and the same 23 type-aware rule names.

## Run

Requires Node **24.19.0**, npm, pnpm **10.28.2**, Python 3, and Git.

```sh
npm ci --registry=https://registry.npmjs.org
npm run build:plugin
npm run prepare:fixture
npm run verify:inputs
node environment.mjs
npm run validate
npm run bench
npm run validate
npm run report
```

For CI, open **Actions → Benchmark → Run workflow**. The workflow publishes a summary and an artifact containing every sample, environment information, and diagnostic reports. Runs are manual to avoid unintentionally mixing benchmark jobs with repository updates.

## Cases

| Configuration | Enabled rules |
| --- | ---: |
| 6 Shadcn Rules + 23 Type-Aware Rules | 29 |
| 23 Type-Aware Rules Only | 23 |

- **Complete fixture:** `fixture-rich` from [shadcn-ui/lint](https://github.com/shadcn-ui/lint/tree/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/packages/evals/fixture-rich): 12 TS/TSX files, 1,058 lines, 3,022 AST nodes. It ties `fixture-ds` for the largest TypeScript fixture by AST nodes.
- **1,000 identical file copies:** byte-identical copies of its largest file, `components/ui/dropdown-menu.tsx` (271 lines, 821 AST nodes). Only the copies are linted; support components and CSS remain available. Each workload has its own TypeScript project.

The plugin is built in CI from upstream commit `53de86f0e7dcc341a9cb45c383a9f2c454d1e958`, using upstream's frozen pnpm lockfile. All engines load that same build. Fixture source and plugin output are hash-checked against that checkout. The root npm lockfile pins benchmark dependencies; nested fixture package manifests are upstream metadata and are not installed separately.

## Method

20 fresh CLI processes per case after 3 warmups, serial randomized interleaving (fixed seed). Reported times are medians. No manual worker limits, lint cache, or fixes. All three CLIs receive the same explicit file list, prepared outside timing. Oxlint also receives `--no-ignore` so generated files are linted despite Git exclusions; input counts are verified. Node module compile caching is disabled equally. Dependency installation, plugin build, input generation, and validation are outside timing.

Timing measures process start through exit, including native JSON/JSONL report serialization, with output discarded. Report formats follow each tool's CLI. Raw data includes all 240 measurements; `summary.json` adds P10/P90, standard deviation, and a bootstrap interval. The same GitHub-hosted Ubuntu 24.04 runner executes all cases in one job; exact image version, CPU, memory, and dependency versions are recorded.

Oxlint uses `oxlint-tsgolint` for type-aware rules. Rslint uses native TypeScript rules; ESLint uses `@typescript-eslint`. Rule names, severity, options, inputs, and tsconfig match, but compiler implementations and versions differ. ESLint's default concurrency is off; native tools retain their own defaults. Default policy does not imply equal worker counts.

## Validation

CI fails if rule counts or measured-workload diagnostics differ. All 23 type-aware rules are exercised by a separate canary, which must produce the same per-rule counts in all three engines. Canary message wording and highlight ranges may differ. Validation runs before and after measurement. Expected diagnostics:

| Workload | 29 rules | 23 rules |
| --- | ---: | ---: |
| Complete fixture | 37 | 0 |
| 1,000 copies | 21,000 | 0 |
| Type-aware canary (not timed) | — | 25 across 23 rules |

See [ts-rules.json](ts-rules.json) for the explicit type-aware rules and the fixture configs for all enabled rules. Shared tsconfigs explicitly load Node/React types.

CI makes the execution traceable, but hosted-runner noise and synthetic duplicated input still limit generalization. Results should be read as measurements of these workloads, not universal rankings.

## License

MIT. Vendored fixture files and the plugin are from shadcn-ui/lint; its copyright notice is preserved in [LICENSE](LICENSE).
