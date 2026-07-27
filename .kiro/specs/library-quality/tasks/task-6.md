# Task 6: CI gating, catalog regeneration, metadata fixes (REQ-5)

## Context

CI currently: `.github/workflows/generate-wobblies.yml` and `release.yml`.
Validation exists but stubs shipped anyway — the gates weren't strict
enough or weren't run on PRs. This task makes the lint + fixtures + tests
blocking, keeps generated artifacts fresh, and fixes the org/branch
metadata drift (README badges → `wobblie-hq`, package.json →
`universe-backwards`, README example-index links → `universe-backwards` +
branch `master`; the real repo is `wobblies-hq/wobblies-library` on
`main`). Depends on Tasks 1–5.

## Subtasks

- [ ] 6.1 PR validation workflow
  - Read both existing workflows first; extend or add a `ci.yml` that runs
    on `pull_request` and `push` to main: `bun install`,
    `bun run typecheck`, `bun run test`,
    `bun scripts/validate-examples.ts` (lint errors fail the job).
  - Upload the lint JSON report as a workflow artifact.
- [ ] 6.2 Generated-artifact freshness gate (design D5)
  - CI step: `bun scripts/generate-examples.ts && git diff --exit-code
    wobblies.json examples.json` — fails when regeneration was skipped.
    Confirm the generate script is deterministic (stable ordering, no
    timestamps); fix ordering if not, note in progress.md.
- [ ] 6.3 Regenerate `wobblies.json` / `examples.json` after the Task 2–4
      rewrites and commit; verify `examples.json` descriptions match the
      rewritten purposes; update the README example index table (or
      confirm `generate-wobblies.yml` does it — read that workflow and
      document what it generates in progress.md).
- [ ] 6.4 Metadata fixes
  - package.json: `repository`, `bugs`, `homepage` →
    `wobblies-hq/wobblies-library`.
  - README badges → `wobblies-hq/wobblies-library`; example-index links →
    `wobblies-hq/wobblies-library/blob/main/...`.
  - Grep the whole repo for `universe-backwards`, `wobblie-hq` (missing
    s), and `/master/` and fix every hit:
    `grep -rn "universe-backwards\|wobblie-hq\|/master/" --exclude-dir=node_modules .`
- [ ] 6.5 Promote the `routine-specificity` lint rule from `warn` to
      `error` (Task 1 seeded it as warn); confirm all 35 wobblies pass;
      delete the grandfather mechanism entirely.
- [ ] 6.6 Update `docs/examples-authoring-guide.md`: document the
      authoring lint rules, fixture requirement, and the D3 skeleton as
      the mandatory structure for new contributions.

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun run typecheck && bun run test
bun scripts/validate-examples.ts
bun scripts/generate-examples.ts && git diff --exit-code wobblies.json examples.json
grep -rn "universe-backwards\|wobblie-hq[^-]\|/master/" --exclude-dir=node_modules --exclude-dir=.git . | grep -v ".kiro/specs" ; echo "hits above must be 0"
# Push a branch and confirm the CI workflow runs and passes on GitHub.
```

## Exit criteria

- CI blocks PRs on lint/tests/freshness; artifacts regenerated and
  committed; zero stale org/branch references; authoring guide documents
  the new bar; specificity rule enforced with no grandfathering.
