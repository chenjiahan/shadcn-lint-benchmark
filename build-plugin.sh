#!/usr/bin/env bash
set -euo pipefail
revision=53de86f0e7dcc341a9cb45c383a9f2c454d1e958
if [ ! -d .upstream/.git ]; then
  git init .upstream
  git -C .upstream remote add origin https://github.com/shadcn-ui/lint.git
fi
git -C .upstream fetch --depth 1 origin "$revision"
git -C .upstream checkout --detach "$revision"
(cd .upstream && pnpm install --frozen-lockfile --registry=https://registry.npmjs.org && pnpm build)
mkdir -p plugin
cp .upstream/packages/lint/dist/* plugin/
cp .upstream/LICENSE plugin/LICENSE
printf '{"type":"module","private":true}\n' > plugin/package.json
