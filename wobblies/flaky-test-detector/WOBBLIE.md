---
id: flaky-test-detector
purpose: Detects intermittently failing tests from recent CI workflow runs and opens tracking issues to fix each identified flaky test.
integrations:
  - github
routines:
  - Retrieve recent CI workflow run results and identify test cases that failed intermittently across multiple runs on the same branch within the past 7 days.
  - Filter test failure patterns to those meeting the flakiness threshold — at least `{{adapt.min_occurrences}}` mixed pass/fail occurrences (default 3) on the same test name and branch.
  - Deduplicate against existing open GitHub issues by checking for matching flaky-test issue titles before creating a new issue.
  - Open one focused GitHub issue per newly detected flaky test, listing affected workflow runs, occurrence counts, pass/fail breakdown, and links to each failing CI run.
deny:
  - Do not open duplicate issues for a flaky test that already has an open tracking issue.
  - Do not flag a test as flaky based on a single failure or failures all on the same commit.
  - Do not modify test source code, CI configuration, or any pull request.
  - Do not close or resolve flaky-test tracking issues automatically.
  - Do not act on failures in archived or disabled workflows.
schedule: '0 8 * * *'
---

# Flaky Test Detector

## Overview

Runs daily, scans recent CI workflow run history for tests with mixed pass/fail results, and opens one tracking issue per newly detected flaky test. Does not act on PRs and never modifies code.

## Scope

Inspect CI workflow run results from the past 7 days for the repository that contains this wobblie. Focus on the default branch and any long-lived integration branches.

## Repository configuration

Use this repository-specific value:

- Minimum flakiness occurrences: `{{adapt.min_occurrences}}` (default: `3`)

## Signal threshold

Include a test in flakiness detection only when:

- The same test name produced both passing and failing results across at least `{{adapt.min_occurrences}}` runs within the past 7 days on the same branch.
- The failures are not attributable to a single commit that was subsequently fixed and never re-failed.

Exclude:

- Tests that consistently fail (not intermittent) — these belong to a different bug report workflow.
- Failures in pull-request-scoped workflow runs (CI on feature branches) where the branch has since been closed.
- Tests in archived or disabled workflows.
- Any failure where all occurrences are on the same commit SHA.

## Low-noise behavior

No-op silently when no test crosses the flakiness threshold within the inspection window.

Before opening a new issue, search existing open GitHub issues for a title containing both the test name and the label `flaky-test`. If a matching open issue exists, no-op for that test.

No-op silently when CI workflow run history is unavailable or the API is unreachable.

## Output format

Open one GitHub issue per newly detected flaky test with:

- Title: `[flaky-test] <test name> intermittently fails in <workflow name>`
- Label: `flaky-test`
- Body sections:
  - **Test**: full test name or test suite + test case
  - **Occurrences**: count of pass and fail results in the window (e.g. "3 failures, 5 passes in 7 days")
  - **Affected runs**: bulleted list of links to each failing CI run (max 5 links; note total count if more)
  - **Suggested fix**: brief heuristic guidance (e.g. "check for timing dependencies, shared state, or external service calls")
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 5 new issues opened per daily run.
- Maximum 5 links to failing CI runs per issue body.
- Do not open issues faster than 1 per 10 seconds to avoid GitHub rate-limit errors.
