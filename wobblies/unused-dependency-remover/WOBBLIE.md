---
id: unused-dependency-remover
purpose: Scans for unused npm packages on a weekly schedule and opens a pull request removing high-confidence unused dependencies with evidence.
integrations:
  - github
routines:
  - Run the configured unused dependency scanner (`{{adapt.scan_command}}`, default `pnpm dlx depcheck --json`) via sandbox and collect its structured JSON output.
  - Filter scan results to packages with high-confidence unused evidence, excluding TypeScript type packages (`@types/*`), peer dependencies, and packages referenced only via dynamic imports or string patterns.
  - Limit the removal batch to at most `{{adapt.max_removals}}` packages (default 3) ordered by confidence, to keep the pull request reviewable.
  - Open one pull request removing the selected unused packages from `package.json` and the lockfile, with per-package removal evidence in the PR body; no-op when no high-confidence unused packages are found.
deny:
  - Do not remove `@types/*` packages unless the corresponding runtime package is also being removed.
  - Do not remove peer dependencies or packages listed in `peerDependencies`.
  - Do not open a PR when confidence is low (scanner flags the package as uncertain or with caveats).
  - Do not open duplicate removal PRs when a wobblie-owned PR already targets the same packages.
  - Do not merge, approve, or modify any open pull request.
schedule: '0 8 * * 1'
---

# Unused Dependency Remover

## Overview

Runs weekly, scans the dependency tree using a sandbox-executed unused-dependency tool, and opens one focused pull request removing high-confidence unused packages. Never removes type packages or peer deps without evidence. No-ops when confidence is low.

## Scope

Scan the `package.json` dependency tree of the repository containing this wobblie. Does not scan monorepo sub-packages unless `{{adapt.scan_paths}}` is configured.

## Repository configuration

Use these repository-specific values:

- Scan command: `{{adapt.scan_command}}` (default: `pnpm dlx depcheck --json`)
- Maximum packages to remove per run: `{{adapt.max_removals}}` (default: `3`)
- Paths to scan: `{{adapt.scan_paths}}` (default: repository root)

## Signal threshold

Include a package in the removal batch only when:

- The scanner reports it as unused with no caveats or uncertainty flags.
- It is not a `@types/*` package (unless its runtime package is also in the removal batch).
- It is not listed under `peerDependencies`.
- It is not referenced via dynamic `import()` string patterns that the scanner cannot statically resolve.

Exclude:

- Packages with any scanner caveat or low-confidence flag.
- Dev-only tooling packages that may be invoked via scripts (e.g. `depcheck`, `eslint`, `prettier`) — verify via `package.json` scripts before including.

## Low-noise behavior

No-op silently when no packages meet the high-confidence unused criterion.

Before opening a PR, search existing open GitHub pull requests for a wobblie-owned PR targeting the same packages. If one exists, update it rather than opening a duplicate.

No-op silently when the sandbox is unavailable or the scanner command fails to produce parseable output.

## Output format

One pull request per weekly run (when signal exists):

- Title: `chore: remove unused dependencies (<package-list>)`
- Branch: `wobblie/unused-deps-<YYYY-MM-DD>`
- PR body sections:
  - **Summary**: "Removed X unused packages identified by `{{adapt.scan_command}}`."
  - **Packages removed**: bulleted list, one per package, with scanner-reported reason (e.g. "not imported anywhere in source or scripts")
  - **Evidence**: relevant excerpt from the scanner JSON output for each removed package (max 5 lines per package)
  - **Not included**: brief note if additional packages were found but excluded due to low confidence or type-package rules
- Do not use tables, nested lists, or code fences in the PR body prose.

## Limits

- Maximum `{{adapt.max_removals}}` packages (default 3) per weekly run.
- One PR per run; no-op if a previous wobblie-owned removal PR is still open.
