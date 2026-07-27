---
id: test-coverage-gate
purpose: Comments on pull requests when test coverage drops more than the configured threshold, surfacing coverage regressions before merge.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Detect available coverage data in the pull request's CI workflow run artifacts or check-run summaries.
  - When CI coverage artifacts are unavailable, run the coverage command (`{{adapt.coverage_command}}`) via sandbox to produce current coverage metrics for the PR branch.
  - Compare the pull request's coverage percentage against the base branch coverage and the configured minimum (`{{adapt.min_coverage_pct}}`).
  - Comment on the pull request with a coverage summary and the regression amount when coverage drops more than `{{adapt.max_drop_pct}}` percentage points; no-op otherwise.
deny:
  - Do not block, close, merge, or approve pull requests.
  - Do not modify source code, test files, or CI configuration.
  - Do not act on draft pull requests.
  - Do not comment more than once per push (re-use an existing wobblie-owned comment if one exists on the PR).
  - Do not report a coverage drop if the absolute coverage remains above `{{adapt.min_coverage_pct}}` and the drop is within `{{adapt.max_drop_pct}}`.
---

# Test Coverage Gate

## Overview

Fires on each PR open or push, measures test coverage for the PR branch, and leaves a comment when coverage drops more than the configured threshold. Never blocks or merges. Comment-only.

## Scope

Evaluate test coverage for the repository containing this wobblie. Compare PR branch coverage against the base branch.

## Repository configuration

Use these repository-specific values:

- Coverage command: `{{adapt.coverage_command}}` (default: `pnpm test --coverage --reporter=json`)
- Minimum absolute coverage: `{{adapt.min_coverage_pct}}` (default: `80`)
- Maximum allowed drop in percentage points: `{{adapt.max_drop_pct}}` (default: `2`)

## Signal threshold

Comment on the pull request only when:

- The PR branch test coverage is more than `{{adapt.max_drop_pct}}` percentage points below the base branch coverage, AND
- The absolute coverage falls below `{{adapt.min_coverage_pct}}` percentage, OR the drop itself exceeds `{{adapt.max_drop_pct}}` points regardless of the absolute value.

Prefer CI-produced coverage artifacts (from check-run summaries or uploaded artifacts) over running the coverage command via sandbox. Fall back to sandbox only when no CI coverage data is available.

Exclude:

- Draft pull requests.
- PRs where coverage data cannot be produced (sandbox failure, no coverage command configured).
- PRs where coverage is unchanged or improves.

## Low-noise behavior

No-op silently when coverage does not drop more than `{{adapt.max_drop_pct}}` percentage points.

If a wobblie-owned coverage comment already exists on the PR from a previous push, update it in place rather than posting a new comment.

No-op silently when the sandbox is unavailable and no CI coverage artifact exists.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "Test coverage dropped by X.X percentage points on this PR (base: Y.Y%, PR: Z.Z%)."
- If below minimum: "Coverage is below the configured minimum of `{{adapt.min_coverage_pct}}`%."
- If above minimum but regressed: "Coverage is still above the minimum but regressed by more than `{{adapt.max_drop_pct}}`%."
- Closing line: "No action is required — this is an informational comment only."
- Do not use tables, nested lists, or code fences.

## Limits

- One comment per pull request (update in place on subsequent pushes).
- Do not block or request changes; comment only.
