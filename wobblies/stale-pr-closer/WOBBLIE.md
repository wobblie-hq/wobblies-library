---
id: stale-pr-closer
purpose: Identifies open pull requests with no activity for a configurable period, warns authors with a comment and stale label, and closes them after continued silence.
integrations:
  - github
routines:
  - List open pull requests across the repository and calculate the days elapsed since last activity (comments, commits, reviews, or label changes), skipping drafts and PRs with pending review requests.
  - Apply the `stale` label and post a warning comment on pull requests inactive for at least `{{adapt.stale_days}}` days (default 14) that have not already been labeled stale.
  - Close pull requests that still have no new activity after `{{adapt.close_days}}` additional days (default 7) since the stale label and warning were applied.
  - Limit total actions to at most 3 pull requests per run to avoid bulk closures.
deny:
  - Do not close draft pull requests.
  - Do not close pull requests that have pending review requests or unresolved review conversations.
  - Do not close pull requests marked with a keep-open or do-not-close label (`{{adapt.exempt_labels}}`, default `keep-open`).
  - Do not merge or approve pull requests.
  - Do not modify source code or any file in the repository.
schedule: '0 9 * * *'
---

# Stale PR Closer

## Overview

Runs daily, identifies open pull requests with no activity for a configurable period, sends a stale warning, and closes them after continued silence. Never touches draft PRs or PRs with pending reviews.

## Scope

Inspect all open (non-draft) pull requests in the repository containing this wobblie.

## Repository configuration

Use these repository-specific values:

- Days before stale warning: `{{adapt.stale_days}}` (default: `14`)
- Days after stale warning before close: `{{adapt.close_days}}` (default: `7`)
- Labels that exempt a PR from staleness: `{{adapt.exempt_labels}}` (default: `keep-open`)

## Signal threshold

Consider a pull request stale when:

- It is open and not a draft.
- No activity (comment, commit push, review submission, or label change) has occurred in at least `{{adapt.stale_days}}` days.
- It has no pending review requests (a requested-but-not-yet-submitted review indicates the PR is still in progress).
- It does not carry any label from `{{adapt.exempt_labels}}`.

Consider a stale pull request ready to close when:

- The `stale` label has been applied by a previous run.
- No new activity has occurred since the label was applied, and `{{adapt.close_days}}` additional days have elapsed.

## Low-noise behavior

No-op silently when all open pull requests have recent activity or qualify for an exemption.

Do not re-warn a pull request that already carries the `stale` label unless `{{adapt.close_days}}` days have also elapsed (in which case, close instead of re-warning).

Limit actions to at most 3 pull requests per run. If more than 3 pull requests qualify, prioritize the oldest by last-activity date.

## Output format

Warning comment on newly stale pull request:

- Mention: "@<author> this pull request has been inactive for `{{adapt.stale_days}}` days and has been marked stale."
- Include: "If you'd like to keep it open, please push a commit or leave a comment. It will be closed in `{{adapt.close_days}}` days if there is no further activity."
- Label applied: `stale`

Close action:

- Closing comment: "Closing this pull request after `{{adapt.stale_days}}` + `{{adapt.close_days}}` days of inactivity. Re-open if you'd like to continue the work."
- State change: closed (not merged)

## Limits

- Maximum 3 pull requests actioned (warned or closed) per daily run.
- Never close more than 1 pull request per run if any closure would affect a PR with at least one approved review.
