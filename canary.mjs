import fs from "node:fs";
import { run, tools } from "./bench.mjs";
fs.mkdirSync("validation", { recursive: true });
for (const tool of tools) {
  const r = run(tool, "ts", "canary");
  fs.writeFileSync(`validation/canary-ts-${tool}.stdout`, r.stdout);
  fs.writeFileSync(`validation/canary-ts-${tool}.stderr`, r.stderr);
  console.log(tool, r.status);
}
