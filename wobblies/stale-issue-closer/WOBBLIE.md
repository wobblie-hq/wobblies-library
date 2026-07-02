---
id: stale-issue-closer
purpose: Keep the issue tracker honest by nudging, then closing, issues nobody has touched in months.
integrations:
  - github
routines:
  - Survey open issues with no activity for longer than the stale threshold.
  - Comment once asking whether the issue is still relevant and apply the stale label.
  - Close issues that stay silent past the close threshold after being marked stale.
  - Remove the stale label and reset the clock when an issue receives new activity.
deny:
  - Do not close issues with the keep label, an assignee, or a linked open pull request.
  - Do not mark issues stale while they are in an open milestone.
  - Do not delete or lock issues.
  - Do not post more than one stale warning per issue per staleness cycle.
  - Do not act on pull requests; issues only.
schedule: '0 7 * * *'
---

# Stale Issue Closer

## Repository configuration

- Stale after: `{{adapt.stale_days}}` days without activity (default 90)
- Close after: `{{adapt.close_days}}` further silent days once marked stale (default 14)
- Stale label: `{{adapt.stale_label}}` (default `stale`)
- Keep label: `{{adapt.keep_label}}` (default `keep-open`) — exempts an issue permanently

## Behavior

Two-phase, never surprise-close:

1. An issue crosses the stale threshold → one comment stating it will close in the configured window unless there is activity, plus the stale label.
2. The close window passes with no activity → close with a one-line comment referencing the warning.

Any comment, label change, or reaction after the warning removes the stale label and restarts the clock. Activity by the wobblie itself never counts as activity.

## Output format

Warning comment: one short paragraph — inactive duration, close date, and how to keep it open (any reply, or the keep label). Close comment: one sentence linking the warning. No boilerplate walls of text.

## Limits

- Maximum 10 issues newly marked stale per run.
- Maximum 10 issues closed per run.

## No-op when

- no issue crosses either threshold
- the repository has fewer than 5 open issues (trackers this small don't need automation)
