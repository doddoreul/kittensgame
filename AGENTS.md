# Agent instructions

- Do not push automatically. Always wait for an explicit user order before running `git push`.
- Before each push, increment the release by +1: run `node tools/generate-buildver.js` (bumps `buildRevision`, the `rN` part of the version, e.g. `v1.6.1.6 r4` → `r5`), commit `build.version.json` with the push.