import json,statistics,random,platform,subprocess,collections,pathlib
root=pathlib.Path(__file__).resolve().parent
raw=json.loads((root/'timings.json').read_text())
groups=collections.defaultdict(list)
for x in raw['samples']:groups[(x['label'],x['tool'],x['mode'])].append(x['ms'])
def q(a,p):
 a=sorted(a);i=(len(a)-1)*p;lo=int(i);hi=min(lo+1,len(a)-1);return a[lo]*(1-(i-lo))+a[hi]*(i-lo)
rng=random.Random(20260915)
def ci(a):
 meds=[statistics.median(rng.choices(a,k=len(a))) for i in range(5000)]
 return [q(meds,.025),q(meds,.975)]
summary=[]
for (label,tool,mode),a in groups.items():
 summary.append(dict(workload=label,tool=tool,mode=mode,n=len(a),medianMs=statistics.median(a),meanMs=statistics.mean(a),stddevMs=statistics.stdev(a) if len(a)>1 else 0,p10Ms=q(a,.1),p90Ms=q(a,.9),minMs=min(a),maxMs=max(a),medianBootstrap95CI=ci(a)))
summary.sort(key=lambda x:(x['workload'],x['mode'],x['tool']))
(root/'summary.json').write_text(json.dumps(summary,indent=2))
for s in summary:print(s['workload'],s['mode'],s['tool'],s['n'],round(s['medianMs'],2),[round(s[k],2) for k in ['p10Ms','p90Ms']])
