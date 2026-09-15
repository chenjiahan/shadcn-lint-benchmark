import json,pathlib,csv,os
root=pathlib.Path(__file__).resolve().parent
raw=json.loads((root/'timings.json').read_text()); stats=json.loads((root/'summary.json').read_text()); env=json.loads((root/'environment.json').read_text())
assert raw['rounds']==20 and raw['warmups']==3
assert len(raw['samples'])==240 and len(stats)==12 and all(x['n']==20 for x in stats)
validation=json.loads((root/'validation/summary.json').read_text())
assert all(validation[k][t]['fullMessageSha256']==validation[k]['eslint']['fullMessageSha256'] for k in ['fixture-ts','fixture-combined','stress-ts','stress-combined'] for t in ['oxlint','rslint'])
with (root/'timings.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['label','mode','tool','round','ms','status']);w.writeheader();w.writerows(raw['samples'])
lines=['# Linter Performance Comparison','',f"[GitHub Actions run]({env['runUrl']}) · Benchmark commit `{env['commit']}`",'',f"**Environment:** {env['cpuModel']}; {env['logicalCpus']} logical CPUs; {env['totalMemoryBytes']/1024**3:.1f} GiB RAM; {env.get('runnerImage',env['platform'])}; Node {env['node']}.",'','**Versions:** Oxlint 1.83.0 + oxlint-tsgolint 7.0.2001; Rslint 0.9.2; ESLint 10.9.1 + typescript-eslint 8.69.0.','','**Method:** Identical inputs and enabled rules; default workers; median of 20 serial CLI runs after 3 warmups per case.','']
for mode,title in [('combined','6 Shadcn Rules + 23 Type-Aware Rules'),('ts','23 Type-Aware Rules Only')]:
 lines += [f'## {title}','','| Workload | Oxlint | Rslint | ESLint |','| --- | ---: | ---: | ---: |']
 for label,name in [('fixture','Complete fixture (12 files)'),('stress','1,000 identical file copies')]:
  vals=[next(s for s in stats if (s['workload'],s['mode'],s['tool'])==(label,mode,t))['medianMs'] for t in ['oxlint','rslint','eslint']]
  lines += ['| '+name+' | '+' | '.join(f'{v:,.2f} ms' for v in vals)+' |']
 lines += ['']
lines += ['## Validation and scope','','All three tools produced identical diagnostics on both measured workloads: 37 / 21,000 findings with 29 rules, and zero with 23 rules. A separate canary exercised all 23 type-aware rules (25 findings per engine); some canary message text and highlight ranges differ.','','Each engine uses its default worker policy. ESLint defaults to concurrency off. The engines use different TypeScript implementations. These measurements describe this CI run and these workloads; hosted-runner variability and identical-copy input limit generalization.','','Raw samples, distribution statistics, environment details, source hashes, and validation reports are attached to the linked CI run.','']
report='\n'.join(lines);(root/'BENCHMARK.md').write_text(report)
if os.getenv('GITHUB_STEP_SUMMARY'):
 with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write(report)
print(report)
