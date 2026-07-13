---
id: release-drafter
purpose: Maintains a single draft GitHub release by appending categorized entries from each merged pull request, without ever publishing or tagging the release.
integrations:
  - github
watch:
  - when a pull request is merged
routines:
  - Retrieve the merged pull request title, labels, and number to determine its release category (feature, fix, docs, chore, or breaking change).
  - Locate the existing wobblie-owned draft release for the current repository's default branch; create one with a placeholder version tag if no draft release exists.
  - Append a categorized entry for the merged pull request to the draft release body, maintaining category order and preserving all previously accumulated entries.
  - Leave the draft release unpublished and untagged; take no action when the merged pull request targets a branch other than the repository default branch.
deny:
  - Do not publish, tag, or finalize any GitHub release.
  - Do not modify or delete release entries added by a human.
  - Do not open or modify pull requests.
  - Do not act when the merged pull request targets a non-default branch.
  - Do not create more than one draft release at a time for the same repository.
---

# Release Drafter

## Overview

Fires on each pull request merge to the default branch, accumulates a categorized entry in the wobblie-owned draft GitHub release, and never publishes. Humans trigger the actual release by reviewing and publishing the draft.

## Scope

Act only on pull requests merged into the repository default branch. Ignore merges to feature branches, release branches, or any non-default branch.

## Repository configuration

No required configuration. The wobblie discovers the default branch and the draft release automatically.

Optional values:

- Custom category labels map: `{{adapt.category_labels}}` (default: maps `enhancement`/`feature` → Feature, `bug`/`fix` → Fix, `documentation`/`docs` → Docs, `chore`/`dependencies` → Chore, `breaking-change` → Breaking Change)

## Signal threshold

Append an entry to the draft release for every pull request merged into the default branch, regardless of size or label. No filtering — all merged PRs contribute to the release notes.

Category assignment:

1. Check PR labels against `{{adapt.category_labels}}` (or the default map).
2. If no label matches, classify as **Other**.
3. If a PR carries a `breaking-change` label, list it in the **Breaking Changes** category regardless of other labels.

## Low-noise behavior

If no draft release exists, create one with a placeholder tag (e.g. `next`) and a header line. Never no-op when a PR was merged to the default branch — every merge produces an entry.

Before appending, verify that the merged PR's number is not already present in the draft release body (idempotency guard for retries).

If the draft release body becomes longer than 50 entries, append a note: "...and more. This draft contains more than 50 entries; consider publishing this release and starting fresh."

## Output format

Entry appended to the draft release body:

- Format: `- <PR title> (#<PR number>) — @<author>`
- Grouped under a Markdown heading matching the category (e.g. `## Features`, `## Fixes`, `## Breaking Changes`, `## Chores`, `## Docs`, `## Other`)
- New categories are added in this order: Breaking Changes, Features, Fixes, Docs, Chores, Other
- Keep headings in that fixed order; append new category headings at the correct position

## Limits

- One draft release maintained at a time.
- No PR entry written more than once (idempotency guard).
- Draft release body capped at a soft limit of 50 entries with a notice when exceeded.
