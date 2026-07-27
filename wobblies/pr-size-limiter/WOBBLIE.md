---
id: pr-size-limiter
purpose: Comments on pull requests that exceed configurable file count or line count thresholds and suggests splitting strategies.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Count the number of changed files and the total number of added plus deleted lines in the pull request diff, excluding files matching `{{adapt.generated_globs}}` and lockfiles.
  - Compare the counts against `{{adapt.max_files}}` and `{{adapt.max_lines}}` thresholds.
  - When either threshold is exceeded, comment on the pull request with the counts and a suggestion to split the PR along a natural seam if one is evident from the diff.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one; remove the comment if the PR shrinks below thresholds.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not add labels unless `{{adapt.size_label}}` is configured.
---

# PR Size Limiter

## Overview

Fires on each PR open or push and checks whether the diff exceeds the team's size thresholds. Leaves a single comment when the PR is too large; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate the pull request diff in the repository containing this wobblie. Exclude files matching `{{adapt.generated_globs}}` (default: `**/package-lock.json,**/yarn.lock,**/pnpm-lock.yaml,**/*.generated.*`) from file and line counts.

## Check definition

The check fails when either:

- The number of changed files (excluding generated/lockfiles) exceeds `{{adapt.max_files}}` (default: `30`).
- The total number of added plus deleted lines (excluding generated/lockfiles) exceeds `{{adapt.max_lines}}` (default: `800`).

The check passes when both counts are within thresholds.

When `{{adapt.size_label}}` is configured, apply or remove that label based on whether the PR exceeds thresholds.

## Low-noise behavior

No-op silently when:

- The PR is within both file and line thresholds.
- The pull request is a draft.
- A wobblie-owned comment already exists with the same counts (no size change since the last push).

If a wobblie-owned comment already exists on the pull request, update the comment in place rather than posting a new one. If the PR shrinks below thresholds on a subsequent push, remove the finding from the comment.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "This PR changes `<N>` files and `<M>` lines (excluding generated files), which exceeds the configured thresholds."
- Thresholds line: "Thresholds: `<max_files>` files, `<max_lines>` lines."
- If a natural split point is evident from the diff (e.g. independent feature vs. refactor, separate directories), include: "Consider splitting: `<suggestion>`."
- Closing line: "Smaller PRs are easier to review and less likely to introduce regressions."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Do not block or request changes; comment only.
