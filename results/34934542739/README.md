# GitHub Actions benchmark — September 15, 2026

[Results](BENCHMARK.md) · [Successful CI run #1](https://github.com/chenjiahan/shadcn-lint-benchmark/actions/runs/34934542739)

This snapshot contains all 240 measured samples from the first CI run, without filtering or reruns. The measured benchmark commit is `277cfe9c3bc775eb38d35722bdf1e23220a32282`.

- [Raw timings (CSV)](timings.csv) / [JSON](timings.json)
- [Statistics, including P10–P90](summary.json)
- [Runner and dependency versions](environment.json)
- [Input and plugin hashes](input-check.json)
- [Diagnostic validation](validation-summary.json)
- [Workflow status and timestamps](workflow-run.json)
- [Artifact metadata](artifact-metadata.json) and [snapshot checksums](sha256.json)

Before/after diagnostic summaries matched exactly. Every case has 20 samples, and all medians were independently recomputed from the raw data. Full diagnostic reports are in the Actions artifact (90-day retention); the data in this directory remains in Git.

To reproduce the exact measured revision:

```sh
git clone https://github.com/chenjiahan/shadcn-lint-benchmark.git
cd shadcn-lint-benchmark
git checkout 277cfe9c3bc775eb38d35722bdf1e23220a32282
```

Then follow the benchmark commands in that revision's root README.
