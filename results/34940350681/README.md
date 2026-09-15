# Shared-core-rule benchmark — September 15, 2026

[Results](BENCHMARK.md) · [Successful CI run #2](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/runs/34940350681)

This snapshot contains all 240 measured samples from the first CI run of the expanded suite, without filtering or reruns. The measured benchmark commit is `63da6a261f405a9177859d203c28b51ab054acee`.

- [Raw timings (CSV)](timings.csv) / [JSON](timings.json)
- [Statistics, including P10–P90](summary.json)
- [Runner and dependency versions](environment.json)
- [Input and plugin hashes](input-check.json)
- [Measured-workload diagnostic validation](validation-summary.json)
- [61 core-rule positive/negative checks](core-canary-summary.json)
- [Effective ESLint rules and executed Rslint rules](effective-rules.json)
- [Rule selection and exclusions](core-rule-selection.json)
- [Workflow status](workflow-run.json), [artifact metadata](artifact-metadata.json), and [snapshot checksums](sha256.json)

Before/after diagnostic, core-canary, and effective-rule summaries matched exactly. All medians were independently recomputed from 20 raw samples per case. The three engines enable 84 or 90 rules. Every core rule reports one positive case and accepts its negative control.

Fixture and compiled-plugin hashes match the earlier 23/29-rule run. This run used AMD EPYC 9V74; the earlier run used Intel Xeon Platinum 8573C. Differences between the two runs cannot be attributed solely to adding rules. Comparisons within each run use the same runner.

Full diagnostic reports are in the Actions artifact (90-day retention); the data in this directory remains in Git. Rule-execution checks do not establish complete semantic equivalence between implementations.

To reproduce the exact measured revision:

```sh
git clone https://github.com/chenjiahan/shadcn-lint-benchmark.git
cd shadcn-lint-benchmark
git checkout 63da6a261f405a9177859d203c28b51ab054acee
```

Then follow that revision's root README.
