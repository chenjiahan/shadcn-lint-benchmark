# Shadcn lint benchmark

Compare **Oxlint, Rslint, and ESLint** with identical inputs and enabled rules on GitHub Actions.

**Latest CI results (61 core rules added):** [Results](results/34940350681/BENCHMARK.md) · [Raw data and verification](results/34940350681) · [Run #2](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/runs/34940350681).

**Previous CI results (without core rules):** [September 15, 2026](results/34934542739/BENCHMARK.md) · [Raw data](results/34934542739) · [Run #1](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/runs/34934542739).

## Benchmarks

| Configuration                                        | Enabled rules |
| ---------------------------------------------------- | ------------: |
| 6 Shadcn Rules + 61 Core Rules + 23 Type-Aware Rules |            90 |
| 61 Core Rules + 23 Type-Aware Rules                  |            84 |

Each configuration runs on two workloads:

- **Complete fixture:** [fixture-rich](https://github.com/shadcn-ui/lint/tree/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/packages/evals/fixture-rich), with 12 TS/TSX files and 1,058 lines. It ties for the largest TypeScript fixture by AST nodes.
- **1,000 identical file copies:** copies of its largest file, `dropdown-menu.tsx` (271 lines), in a separate TypeScript project.

## Shared core rules

The [selected 61 rules](core-rules.json) come from ESLint 10.9.1 recommended (the same 64-rule list as `@eslint/js@10.0.1`). Oxlint and Rslint run their native implementations; no ESLint core plugin fallback is loaded.

Three rules are excluded:

- `no-dupe-args` and `no-octal`: absent from Oxlint 1.83.0's ESLint rule catalog.
- `no-nonoctal-decimal-escape`: Rslint 0.9.2 reports parser error `TS1488` on the positive case instead of the lint rule. This is a comparability exclusion, not a claim that the rule is unimplemented.

See [selection details](core-rule-selection.json) and [positive cases](core-canaries.json). These checks verify execution, not complete semantic equivalence. The measured fixtures produce no core-rule findings; the canaries run outside timing.

## Method

- Median of **20 runs after 3 warmups** per case, randomly interleaved and executed serially on one Ubuntu 24.04 runner.
- **Default workers**, identical file lists, and no lint or Node module compile cache. ESLint defaults to concurrency off.
- Dependencies are pinned. All tools load the same plugin build from upstream commit [`53de86f`](https://github.com/shadcn-ui/lint/commit/53de86f0e7dcc341a9cb45c383a9f2c454d1e958), with source hashes verified.
- Rules and workload diagnostics are checked before and after timing. Separate canaries exercise all [61 core rules](core-rules.json) and [23 type-aware rules](ts-rules.json). Core rules must each report one positive case and accept a negative control. ESLint effective configs and Rslint execution timing also verify the rule counts.

Timing covers each CLI process through exit, including report serialization. Setup and validation are excluded. Oxlint uses `oxlint-tsgolint`; Rslint and ESLint use their respective TypeScript implementations. Compiler differences, hosted-runner variability, and duplicated input limit generalization.

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

For CI, open [**Actions → Benchmark → Run workflow**](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/workflows/benchmark.yml). Each run publishes a summary and downloadable raw samples, environment details, and validation reports.

## License

[MIT](LICENSE). Fixtures and plugin originate from shadcn-ui/lint.
