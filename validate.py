import json,collections,pathlib,hashlib
root=pathlib.Path(__file__).resolve().parent
out={};statuses={}
for label in ['canary','fixture','stress']:
 for mode in (['ts'] if label=='canary' else ['ts','combined']):
  key=f'{label}-{mode}';rows={}
  cwd=root/('canary-fixture' if label=='canary' else 'stress-fixture' if label=='stress' else 'fixture')
  for tool in ['eslint','oxlint','rslint']:
   p=root/'validation'/f'{key}-{tool}.stdout'
   assert p.exists(), f"Missing report: {p}"
   s=p.read_text();res=[];detail=[];meta={}
   if tool=='eslint':
    for f in json.loads(s):
     assert not f['fatalErrorCount'],f
     for m in f['messages']:
      file=str(pathlib.Path(f['filePath']).relative_to(cwd));rule=m['ruleId'].replace('@typescript-eslint/','typescript/');res.append((file,rule,m['line'],m['column'],m.get('endLine'),m.get('endColumn')));detail.append(res[-1]+(m['message'],))
   elif tool=='oxlint':
    v=json.loads(s);meta={k:v[k] for k in ['number_of_files','number_of_rules','threads_count']};assert meta['number_of_rules']==(23 if mode=='ts' else 29),meta
    for m in v['diagnostics']:
     span=m['labels'][0]['span'];file=m['filename'];rule=m['code'].replace('(','/').removesuffix(')');prefix=(cwd/file).read_bytes()[:span['offset']+span['length']].decode();res.append((file,rule,span['line'],span['column'],prefix.count('\n')+1,len(prefix.rsplit('\n',1)[-1])+1));detail.append(res[-1]+(m['message'],))
   else:
    for l in s.splitlines():
     m=json.loads(l);pos=m['range'];res.append((m['filePath'],m['ruleName'].replace('@typescript-eslint/','typescript/'),pos['start']['line'],pos['start']['column'],pos['end']['line'],pos['end']['column']));detail.append(res[-1]+(m['message'],))
   assert not (root/'validation'/f'{key}-{tool}.stderr').read_text()
   rows[tool]=sorted(res);statuses[f'{key}-{tool}']=1 if res else 0
   out.setdefault(key,{})[tool]={'count':len(res),'byRule':dict(collections.Counter(x[1] for x in res)),'ruleLocationSha256':hashlib.sha256(json.dumps(sorted(res)).encode()).hexdigest(),'fullMessageSha256':hashlib.sha256(json.dumps(sorted(detail)).encode()).hexdigest(),**meta}
   (root/'validation'/f'{key}-{tool}.normalized.json').write_text(json.dumps(sorted(detail),indent=2))
  for tool in ['oxlint','rslint']:
   if tool not in rows:continue
   a=collections.Counter(rows.get('eslint',[]));b=collections.Counter(rows[tool]);out[key][tool]['missingVsEslint']=list((a-b).elements());out[key][tool]['extraVsEslint']=list((b-a).elements())
(root/'validation/summary.json').write_text(json.dumps(out,indent=2)+'\n');(root/'expected-statuses.json').write_text(json.dumps(statuses,indent=2)+'\n')
for key,v in out.items():
 print(key)
 for t,x in v.items():print(t,x['count'],len(x['byRule']),'rule kinds','missing',len(x.get('missingVsEslint',[])),'extra',len(x.get('extraVsEslint',[])))

# Fail before publishing measurements if any gate fails. Canary highlights may differ.
for key, engines in out.items():
 assert set(engines)=={'eslint','oxlint','rslint'}, key
 expected=25 if key=='canary-ts' else 0 if key.endswith('-ts') else 37 if key.startswith('fixture') else 21000
 for tool, info in engines.items():
  assert info['count']==expected, (key,tool,info['count'],expected)
  assert info['byRule']==engines['eslint']['byRule'], (key,tool,'rule counts differ')
  if key=='canary-ts':
   assert len(info['byRule'])==23, (tool,'canary coverage')
  else:
   assert info['fullMessageSha256']==engines['eslint']['fullMessageSha256'], (key,tool,'diagnostics differ')
  if tool=='oxlint':
   assert info['number_of_files']==(1 if key=='canary-ts' else 12 if key.startswith('fixture') else 1000), (key,info)
print('PASS: rule coverage, diagnostic parity, and input counts')
