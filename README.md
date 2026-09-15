# Shadcn lint benchmark

Compare **Oxlint, Rslint, and ESLint** with identical inputs and enabled rules on GitHub Actions.

## Benchmarks

| Configuration | Enabled rules |
| --- | ---: |
| 6 Shadcn Rules + 23 Type-Aware Rules | 29 |
| 23 Type-Aware Rules Only | 23 |

Each configuration runs on two workloads:

- **Complete fixture:** [fixture-rich](https://github.com/shadcn-ui/lint/tree/53de86f0e7dcc341a9cb45c383a9f2c454d1e958/packages/evals/fixture-rich), with 12 TS/TSX files and 1,058 lines. It ties for the largest TypeScript fixture by AST nodes.
- **1,000 identical file copies:** copies of its largest file, `dropdown-menu.tsx` (271 lines), in a separate TypeScript project.

## Method

- Median of **20 runs after 3 warmups** per case, randomly interleaved and executed serially on one Ubuntu 24.04 runner.
- **Default workers**, identical file lists, and no lint or Node module compile cache. ESLint defaults to concurrency off.
- Dependencies are pinned. All tools load the same plugin build from upstream commit [`53de86f`](https://github.com/shadcn-ui/lint/commit/53de86f0e7dcc341a9cb45c383a9f2c454d1e958), with source hashes verified.
- Rules and workload diagnostics are checked before and after timing. A separate canary exercises all [23 type-aware rules](ts-rules.json).

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
