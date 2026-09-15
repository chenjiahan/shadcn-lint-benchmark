# Linter Performance Comparison

[GitHub Actions run](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/runs/34940350681) · Benchmark commit `63da6a261f405a9177859d203c28b51ab054acee`

**Environment:** AMD EPYC 9V74 80-Core Processor; 4 logical CPUs; 15.6 GiB RAM; ubuntu24; Node v24.19.0.

**Versions:** Oxlint 1.83.0 + oxlint-tsgolint 7.0.2001; Rslint 0.9.2; ESLint 10.9.1 + typescript-eslint 8.69.0.

**Method:** Identical inputs and enabled rules; default workers; median of 20 serial CLI runs after 3 warmups per case.

## 6 Shadcn Rules + 61 Core Rules + 23 Type-Aware Rules

| Workload | Oxlint | Rslint | ESLint |
| --- | ---: | ---: | ---: |
| Complete fixture (12 files) | 679.28 ms | 830.18 ms | 3,001.78 ms |
| 1,000 identical file copies | 5,912.35 ms | 7,121.45 ms | 27,094.02 ms |

## 61 Core Rules + 23 Type-Aware Rules

| Workload | Oxlint | Rslint | ESLint |
| --- | ---: | ---: | ---: |
| Complete fixture (12 files) | 351.22 ms | 304.43 ms | 2,872.59 ms |
| 1,000 identical file copies | 3,918.62 ms | 3,718.31 ms | 25,169.47 ms |

## Validation and scope

All three tools produced identical diagnostics on both measured workloads: 37 / 21,000 findings with 90 rules, and zero with 84 rules. Each engine passed 61 core-rule positive cases and 61 negative controls, with one finding per positive case. These checks demonstrate rule execution, not full semantic equivalence. A separate canary exercised all 23 type-aware rules (25 findings per engine); some canary message text and highlight ranges differ.

The 61 core rules are the verified common subset of ESLint recommended. `no-dupe-args` and `no-octal` are absent from the Oxlint 1.83.0 core-rule catalog. `no-nonoctal-decimal-escape` is excluded because Rslint reports a parser error on its positive case instead of a lint-rule finding. Each engine uses its default worker policy. ESLint defaults to concurrency off. The engines use different TypeScript implementations. These measurements describe this CI run and these workloads; hosted-runner variability and identical-copy input limit generalization.

Raw samples, distribution statistics, environment details, source hashes, and validation reports are attached to the linked CI run.
