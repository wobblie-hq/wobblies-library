# Library Quality — Make Every Catalog Wobblie Produce Its Stated Result

## Problem

The library ships 35 wobblie definitions, but an audit (2026-07-02) found
**20 of 35 are scaffolded stubs** that cannot produce their stated result no
matter how well the platform executes them:

- Identical boilerplate routines in all 20: "Analyze the pull request for
  relevant signals. / Take appropriate action based on findings. / Comment or
  create issues with clear, actionable feedback." The routine block — the
  agent's actual instructions — says nothing about what the wobblie claims
  to do.
- Copy-pasted trigger blocks: all 20 stubs have BOTH PR watch rules
  (`when a pull request is opened/synchronized`) AND `schedule: '0 9 * * *'`,
  regardless of the wobblie's nature.
- Identical deny lists and a body that just restates the purpose plus
  "Maximum 1 action per PR per activation" — even on wobblies whose purpose
  is a scheduled repo-wide scan.

Worst-case example: `security-advisory-watcher` — purpose says "Monitors
GitHub security advisories for dependencies", but its instructions tell the
agent to analyze pull requests. `flaky-test-detector` claims to find tests
that "intermittently fail across recent CI runs" with no instruction (or
platform capability reference) for reading CI history.

The 15 authored wobblies (github-activity-digest, docs-drift-maintainer,
docs-stale-maintainer, js-ts-dependency-upgrades, the four linear-*, ping,
pr-check-repair, pr-merge-conflict-repair, pr-metadata, pr-review-triage,
slack-alert-context-researcher, slack-meeting-followup-planner) show what
good looks like: specific routines, signal thresholds, output format
contracts, low-noise/no-op policies.

## What existing validation covers (and misses)

`bun scripts/validate-examples.ts` → `src/examples/` pipeline validates
catalog structure (zod `schema.ts`) and public-safety regexes
(`public-safety.ts`: leaked tokens, private keys, internal URLs, home
paths). It does NOT validate:

1. **Specificity** — boilerplate routines pass schema validation.
2. **Trigger coherence** — schedule+watch combos, PR-scoped limits on
   scheduled scanners, purposes that contradict triggers.
3. **Capability feasibility** — nothing checks that a wobblie's
   instructions only require data/actions the wobblies platform actually
   provides (see wobblie.ai `.kiro/specs/wobblie-reliability/` for the
   platform-side capability work).
4. **Behavior** — no fixtures or tests assert what a wobblie should do
   given a representative trigger event.

## Goal

Every wobblie in the catalog has (a) a specific, achievable contract whose
triggers match its nature, (b) machine-checked authoring lints in CI so
stubs can never ship again, and (c) a behavioral fixture asserting its
desired output, consumable by the platform's replay harness.

Related spec: `wobblie.ai/.kiro/specs/wobblie-reliability/` fixes the
platform side (read actions, sandbox, outcome reporting). This spec fixes
the content side. Task 7 here validates both together.

## Repo facts (verified)

- Runtime: bun; tests: vitest (`bun run test` → `vitest run`); typecheck
  `tsc --noEmit`; build via zshy.
- Validation pipeline: `scripts/validate-examples.ts` →
  `src/examples/cli.ts` (`runValidateCli`) → `catalog.ts`, `schema.ts`,
  `validation.ts`, `public-safety.ts`.
- Catalog artifacts: `wobblies.json`, `examples.json`
  (`scripts/generate-examples.ts`).
- CI: `.github/workflows/generate-wobblies.yml`, `release.yml`.
- Metadata drift: README badges → `wobblie-hq/...`, package.json
  repository → `universe-backwards/wobblies-library`, actual org is
  `wobblies-hq`. README example-index links also point at
  `universe-backwards` and branch `master` (repo uses `main`).
