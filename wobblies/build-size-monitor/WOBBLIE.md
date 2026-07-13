---
id: build-size-monitor
purpose: Comments on pull requests that change dependency manifests or bundler configuration when the estimated bundle size impact exceeds a configurable threshold, helping teams prevent unintentional bloat.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Identify changed dependency manifests (package.json, yarn.lock, pnpm-lock.yaml, Cargo.toml, go.sum) and bundler configuration files in the pull request diff; no-op when none are touched.
  - Estimate size impact from lockfile evidence — new dependencies added, duplicated dependency trees, or major version bumps that increase transitive dependency count.
  - When `{{adapt.size_command}}` is configured, run it in the sandbox to get precise size measurements instead of estimates.
  - Comment on the pull request only when estimated or measured impact exceeds `{{adapt.threshold_kb}}`; edit the existing wobblie-owned comment in place on subsequent pushes.
  - No-op silently when the size impact is below the threshold or no dependency/bundler files changed.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, dependency manifests, or repository settings.
  - Do not act on draft pull requests.
  - Do not comment when the size impact is below `{{adapt.threshold_kb}}`.
  - Do not install dependencies or run builds outside the sandbox.
  - Do not comment more than once per pull request (edit the existing comment in place).
  - Do not flag size changes in dev-only dependencies unless they affect the production bundle.
---

# Build Size Monitor

## Overview

Fires on each PR open or push when dependency manifests or bundler configuration change. Estimates (or measures via sandbox command) the bundle size impact and comments only when the impact exceeds the configured threshold. Comment-only — never blocks or merges.

## Scope

Trigger analysis when any of these file patterns are changed in the diff:

- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `Cargo.toml`, `Cargo.lock`, `go.mod`, `go.sum`
- Bundler configs: `webpack.config.*`, `vite.config.*`, `rollup.config.*`, `esbuild.*`, `tsconfig.json` (when `paths` or `compilerOptions.outDir` change)

Only production-affecting changes count. Dev-dependency additions that do not enter the production bundle are excluded.

## Signal threshold

Comment only when the estimated or measured size impact exceeds `{{adapt.threshold_kb}}` (default: 50 KB).

Impact estimation methods (in priority order):

1. **Sandbox measurement** (when `{{adapt.size_command}}` is set): Run the command in the sandbox and compare output against the base branch measurement. Report exact delta.
2. **Lockfile analysis** (default): Count new transitive packages added, estimate average package size from registry metadata when available, flag duplicated dependency subtrees.

Signals that warrant a comment:

- New production dependency adding estimated > threshold KB.
- Duplicated dependency tree (same package at multiple incompatible versions).
- Major version bump that significantly increases transitive dependency count.

## Low-noise behavior

No-op silently when:

- No dependency manifests or bundler configuration files are changed.
- The pull request is a draft.
- The estimated or measured impact is below `{{adapt.threshold_kb}}`.
- A wobblie-owned comment already exists with identical findings.

If a wobblie-owned comment already exists on the pull request, update the comment in place. Remove findings that no longer apply after a push.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "Bundle size impact detected (estimated > {{adapt.threshold_kb}} KB):"
- List of findings, each showing: the dependency or change, estimated/measured size delta, and reason for concern (new dep, duplicate tree, etc.).
- If `{{adapt.size_command}}` was used, note: "Measured via `<command>`."
- Closing line: "Consider whether this size increase is justified or if a lighter alternative exists."
- Maximum 5 findings per comment.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 5 findings shown per comment.
- Do not block, request changes, or merge.
