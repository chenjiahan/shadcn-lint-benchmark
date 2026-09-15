# Linter Performance Comparison

[GitHub Actions run](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/runs/34934542739) · Benchmark commit `277cfe9c3bc775eb38d35722bdf1e23220a32282`

**Environment:** INTEL(R) XEON(R) PLATINUM 8573C; 4 logical CPUs; 15.6 GiB RAM; ubuntu24; Node v24.19.0.

**Versions:** Oxlint 1.83.0 + oxlint-tsgolint 7.0.2001; Rslint 0.9.2; ESLint 10.9.1 + typescript-eslint 8.69.0.

**Method:** Identical inputs and enabled rules; default workers; median of 20 serial CLI runs after 3 warmups per case.

## 6 Shadcn Rules + 23 Type-Aware Rules

| Workload | Oxlint | Rslint | ESLint |
| --- | ---: | ---: | ---: |
| Complete fixture (12 files) | 634.97 ms | 753.81 ms | 2,695.04 ms |
| 1,000 identical file copies | 5,501.85 ms | 6,339.21 ms | 23,863.84 ms |

## 23 Type-Aware Rules Only

| Workload | Oxlint | Rslint | ESLint |
| --- | ---: | ---: | ---: |
| Complete fixture (12 files) | 334.61 ms | 280.05 ms | 2,552.68 ms |
| 1,000 identical file copies | 3,621.41 ms | 3,261.99 ms | 21,746.39 ms |

## Validation and scope

All three tools produced identical diagnostics on both measured workloads: 37 / 21,000 findings with 29 rules, and zero with 23 rules. A separate canary exercised all 23 type-aware rules (25 findings per engine); some canary message text and highlight ranges differ.

Each engine uses its default worker policy. ESLint defaults to concurrency off. The engines use different TypeScript implementations. These measurements describe this CI run and these workloads; hosted-runner variability and identical-copy input limit generalization.

Raw samples, distribution statistics, environment details, source hashes, and validation reports are attached to the linked CI run.
