import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(root,'stress-fixture/stress');
fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync(path.join(root,'fixture/components/ui/dropdown-menu.tsx'));
for(let i=0;i<1000;i++) fs.writeFileSync(path.join(dir,`dropdown-${String(i).padStart(4,'0')}.tsx`),source);
console.log('Prepared 1000 byte-identical copies. Run npm run validate, then npm run bench.');
