# Task 2: Rewrite scheduled-scanner stubs (REQ-3)

## Context

These 7 wobblies have purposes that describe scheduled repo-wide scanning,
but their stub definitions carry copy-pasted PR watch rules, PR-scoped
routines, and "Maximum 1 action per PR" limits. Rewrite each to the
authored skeleton in design **D3** (model files:
`wobblies/github-activity-digest/WOBBLIE.md`,
`wobblies/docs-stale-maintainer/WOBBLIE.md` — read both first).

General rules for all 7:

- Trigger: `schedule` only (drop the PR watch rules) unless noted.
- Routines: 3–6 imperative steps naming the wobblie's actual signals and
  actions. Reference platform capabilities that exist in
  `src/examples/platform-capabilities.ts` (e.g. workflow-run history via
  `github.list_workflow_runs` — pending is acceptable, lint warns).
- Body: Overview / Scope / Signal threshold (include+exclude lists) /
  Low-noise behavior (explicit no-op conditions, duplicate protection) /
  Output format (exact action + content contract) / Limits (per run, not
  per PR).
- Deny: tailored (keep genuinely applicable entries, drop PR-only ones).
- Use `{{adapt.*}}` placeholders for repo-specific values (thresholds,
  channels, paths) and list them in the body.
- Keep watch rules (where any remain) in "when a <event> is <action>"
  format.

## Subtasks

- [ ] 2.1 `flaky-test-detector` — daily scan of recent workflow runs for
      tests failing intermittently (same test, mixed pass/fail across runs
      on the same ref); opens ONE issue per flaky test with occurrences
      and links; dedupe against existing open issues (title convention);
      no-op when no test crosses the flakiness threshold
      (`{{adapt.min_occurrences}}`, default 3 in 7 days).
- [ ] 2.2 `security-advisory-watcher` — capability decision first: the
      platform has no advisories/Dependabot read capability. Options:
      (a) redesign around what exists — scheduled sandbox `run_command`
      audit (`pnpm audit --json` / `npm audit`) with lockfile evidence, or
      (b) remove from catalog until the platform ships an advisories
      capability. RECOMMENDED: (a), scoped to high/critical, one issue per
      advisory, dedupe by advisory id in issue title. Record the decision
      + reasoning in progress.md.
- [ ] 2.3 `stale-pr-closer` — daily scan of open PRs with no activity for
      `{{adapt.stale_days}}` (default 14); comment asking status + label
      `stale`; close only after a further `{{adapt.close_days}}` of
      silence AFTER the stale label; never touch draft PRs or PRs with
      requested changes in review; max 3 PRs actioned per run.
- [ ] 2.4 `test-coverage-gate` — decide nature deliberately: as a "gate"
      it is PR-triggered, not scheduled — reclassify to PR watch; compare
      coverage from the PR's CI artifacts/output when available, else
      sandbox `run_command` coverage run; comment only when coverage drops
      > `{{adapt.max_drop_pct}}`; never block/merge (comment-only).
- [ ] 2.5 `type-coverage-monitor` — weekly scheduled sandbox run of a type
      coverage tool (`{{adapt.type_coverage_command}}`); track trend via
      its own memory; post/update ONE issue when coverage falls below
      `{{adapt.min_pct}}`; no-op otherwise.
- [ ] 2.6 `unused-dependency-remover` — weekly scheduled sandbox scan
      (depcheck/knip via `{{adapt.scan_command}}`); ONE PR removing at
      most `{{adapt.max_removals}}` (default 3) high-confidence unused
      deps with evidence per removal; no-op when confidence is low; never
      remove types packages or peer deps without direct evidence.
- [ ] 2.7 `release-drafter` — trigger on merges to the default branch
      ("when a pull request is merged" if the platform parser supports it;
      verify against the platform's GitHub event map — the parseable
      action list lives in wobblie.ai `packages/core`; if unsupported,
      fall back to schedule). Maintains ONE draft release accumulating
      categorized merged-PR entries; never publishes a release.

For each wobblie: run the lint on the single file, fix findings, remove its
id from the grandfather allowlist (from Task 1.5).

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun scripts/validate-examples.ts   # 7 fewer grandfathered ids, zero errors
bun run test && bun run typecheck
git diff --stat wobblies/          # only the 7 directories touched
```

## Exit criteria

- All 7 pass the authoring lint with no grandfathering; decisions (2.2
  redesign, 2.4 reclassification, 2.7 trigger) recorded in progress.md.
